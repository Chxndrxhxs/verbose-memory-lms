"""Background extract jobs: long PDFs run off the request thread.

Sync extraction does one Gemini call per page (~49s for 17 pages), which
blocks a gunicorn worker and risks timeouts on big papers. Jobs run the same
``extract_document_questions`` pipeline on a daemon thread and persist
progress to ``MEDIA_ROOT/extract_jobs/<job_id>.json`` so the UI can poll
``GET admin/assignments/extract-jobs/<job_id>`` instead of holding a POST
open. Resume still works through ``pending_pages`` on the next run.
"""

import json
import logging
import threading
import time
import uuid
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)

_JOBS: dict[str, dict] = {}
_LOCK = threading.Lock()


def _job_path(job_id: str) -> Path:
    target = Path(settings.MEDIA_ROOT) / "extract_jobs" / f"{job_id}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    return target


def _persist(job: dict) -> None:
    try:
        _job_path(job["job_id"]).write_text(json.dumps(job), encoding="utf-8")
    except OSError:
        logger.warning("Could not persist extract job %s", job["job_id"], exc_info=True)


def _read_persisted(job_id: str) -> dict | None:
    try:
        return json.loads(_job_path(job_id).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def enqueue(config: dict) -> dict:
    """Start a background extract; returns the initial job envelope."""
    job_id = uuid.uuid4().hex[:12]
    job = {
        "job_id": job_id,
        "status": "queued",
        "source_document": str(config.get("source_document") or ""),
        "questions": [],
        "done_pages": [],
        "pending_pages": [],
        "skipped_pages": [],
        "total_pages": 0,
        "rate_limited": False,
        "error": "",
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    with _LOCK:
        _JOBS[job_id] = job
    _persist(job)
    thread = threading.Thread(
        target=_run, args=(job_id, config), name=f"extract-{job_id}", daemon=True
    )
    thread.start()
    return {"job_id": job_id, "status": job["status"]}


def get(job_id: str) -> dict | None:
    """Latest job envelope, from memory or the persisted file."""
    with _LOCK:
        job = _JOBS.get(job_id)
    if job is not None:
        return dict(job)
    persisted = _read_persisted(job_id)
    if persisted is not None:
        with _LOCK:
            _JOBS[job_id] = persisted
        return dict(persisted)
    return None


def _run(job_id: str, config: dict) -> None:
    from .services import extract_document_questions

    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return
        job["status"] = "running"
        job["updated_at"] = time.time()
    _persist(job)
    try:
        result = extract_document_questions({**config, "async_mode": False})
    except ValueError as exc:
        _finish(job_id, status="failed", error=str(exc))
        return
    except Exception as exc:  # never leave a job stuck in running
        logger.exception("Extract job %s crashed", job_id)
        _finish(job_id, status="failed", error=str(exc))
        return
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return
        job.update(
            {
                "status": "paused" if result.get("rate_limited") else "done",
                "questions": result.get("questions", []),
                "done_pages": result.get("done_pages", []),
                "pending_pages": result.get("pending_pages", []),
                "skipped_pages": result.get("skipped_pages", []),
                "total_pages": result.get("total_pages", 0),
                "rate_limited": bool(result.get("rate_limited")),
                "error": result.get("error", ""),
                "updated_at": time.time(),
            }
        )
    _persist(job)


def _finish(job_id: str, status: str, error: str = "") -> None:
    with _LOCK:
        job = _JOBS.get(job_id)
        if job is None:
            return
        job["status"] = status
        job["error"] = error
        job["updated_at"] = time.time()
    _persist(job)
