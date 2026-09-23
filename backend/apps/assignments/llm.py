"""Question generation and verbatim extraction via Google Gemini.

Generate mode uses the OpenAI-compatible ``/chat/completions`` endpoint that
AI Studio exposes. Extract mode uses the native ``:generateContent`` endpoint
so page figures can travel as vision inputs alongside the MarkItDown markdown.

Configure with: LLM_API_KEY=<ai-studio-key>,
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/,
LLM_MODEL=gemini-2.0-flash
"""

import json
import logging
import random
import re
import time
from typing import Any

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

_INSTRUCTION = """\n\nSOURCE MATERIAL:\n{text}"""

_SYSTEM_PROMPT = """You are an expert exam question designer. Using ONLY the source material
provided, create exactly {count} multiple-choice questions. Follow these rules:

1. Every question must be answerable solely from the source material — never invent facts.
2. Each question has exactly {options_count} options, every option non-empty and plausible.
3. "correct_answer" is the 0-based index of the correct option.
4. "difficulty" is one of: easy, medium, hard.
5. "topic" is a short, specific label (max 3 words) taken from the source topic.
6. "marks" is a positive number (use {marks} unless a question clearly merits more).
7. "explanation" is 1-2 sentences citing what the source says.

Respond with ONLY valid JSON. Do not wrap it in markdown. Shape:
{{"questions": [{{"question": "...", "options": ["...", "...", "..."],
"correct_answer": 0, "explanation": "...", "marks": {marks},
"difficulty": "easy", "topic": "..."}}]}}"""


_EXTRACT_SYSTEM_PROMPT = """You extract multiple-choice questions that ALREADY EXIST in
the source material below. Copy each question and its options VERBATIM — do not
rewrite, summarise, or invent questions. Skip anything that is not a numbered
question with at least 2 options.

Options may be text or figures:
- Text options: copy the text verbatim.
- Figure options: set {"text": "Figure N", "image_ref": N} where N is the
  1-based index of the figure as presented with the page (first figure = 1).
- If the question stem itself refers to a figure, set "question_image_ref"
  to that figure's 1-based index, else null.

If an answer key, solution, or correct option is printed in the source, record
"correct_answer" (0-based) and "has_answer": true; otherwise set
"correct_answer" to 0 and "has_answer" to false. Never guess — an answer key
appended after the questions applies to the questions on this page.

Respond with ONLY valid JSON. Do not wrap it in markdown. Shape:
{{"questions": [{{"question": "...", "question_image_ref": null,
"options": ["...", "..."], "correct_answer": 0, "has_answer": true,
"explanation": "", "difficulty": "medium", "topic": "..."}}]}}"""

_GEMINI_IMAGE_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

# Stems that point at artwork ("completes the figure", "as shown below").
# Used to flag questions whose figure never materialised as an image, so the
# instructor can attach it manually instead of publishing a blind stem.
_FIGURE_REFERENCE_RE = re.compile(
    r"question\s*mark|\bfigures?\b(?!\s+of\s+speech)|\bimages?\b|diagram|as\s+shown|"
    r"shown\s+(below|above)|given\s+(below|above|figure)|in\s+the\s+"
    r"(figure|diagram|image|picture)",
    re.IGNORECASE,
)


def stem_references_figure(text: str) -> bool:
    """True when a stem points at artwork that should be visible."""
    return bool(text and _FIGURE_REFERENCE_RE.search(text))


_GEMINI_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
_GEMINI_MAX_RETRIES = 6
_GEMINI_BACKOFF_BASE_SECONDS = 5.0
_GEMINI_BACKOFF_CAP_SECONDS = 60.0


class GeminiRateLimitedError(Exception):
    """Gemini still answered 429 after exhausting backoff retries."""


def _retry_delay_seconds(response: httpx.Response | None, attempt: int) -> float:
    """Exponential backoff, honouring a server RetryInfo retryDelay if present."""
    delay = min(
        _GEMINI_BACKOFF_CAP_SECONDS,
        _GEMINI_BACKOFF_BASE_SECONDS * (2**attempt) + random.uniform(0, 1),
    )
    if response is not None:
        try:
            details = (response.json().get("error", {}) or {}).get("details", [])
            for detail in details:
                if isinstance(detail, dict) and detail.get("retryDelay"):
                    match = re.search(r"([\d.]+)s", str(detail["retryDelay"]))
                    if match:
                        delay = max(delay, float(match.group(1)))
        except (ValueError, AttributeError):
            pass
    return delay


def _gemini_image_part(data: bytes, suffix: str) -> dict:
    import base64

    return {
        "inline_data": {
            "mime_type": _GEMINI_IMAGE_MIME_TYPES.get(suffix.lower(), "image/png"),
            "data": base64.b64encode(data).decode("ascii"),
        }
    }


def _gemini_model_url() -> str:
    """Native generateContent URL derived from the OpenAI-compatible base."""
    base = settings.LLM_BASE_URL.rstrip("/")
    if "/openai" in base:
        base = base.split("/openai")[0]
    return f"{base}/models/{settings.LLM_MODEL}:generateContent"


def _gemini_request(payload: dict, timeout: float = 180.0, max_retries: int | None = None) -> dict:
    """POST to generateContent, backing off on 429/5xx before giving up."""
    if max_retries is None:
        max_retries = int(getattr(settings, "LLM_EXTRACT_MAX_RETRIES", _GEMINI_MAX_RETRIES))
    headers = {
        "x-goog-api-key": settings.LLM_API_KEY,
        "Content-Type": "application/json",
    }
    last_error: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            response = httpx.post(
                _gemini_model_url(), json=payload, headers=headers, timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code if exc.response is not None else 0
            last_error = exc
            if status not in _GEMINI_RETRYABLE_STATUS or attempt >= max_retries:
                if status == 429:
                    raise GeminiRateLimitedError(
                        "Gemini rate limit still in effect after retries"
                    ) from exc
                raise
            delay = _retry_delay_seconds(exc.response, attempt)
            logger.warning(
                "Gemini %s on generateContent; retry %s/%s in %.1fs",
                status,
                attempt + 1,
                max_retries,
                delay,
            )
            time.sleep(delay)
        except httpx.TimeoutException as exc:
            last_error = exc
            if attempt >= max_retries:
                raise
            delay = _retry_delay_seconds(None, attempt)
            logger.warning(
                "Gemini timeout on generateContent; retry %s/%s in %.1fs",
                attempt + 1,
                max_retries,
                delay,
            )
            time.sleep(delay)
    raise last_error  # pragma: no cover - loop always sets last_error


def _gemini_text(content: dict) -> str:
    parts = (content.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts if isinstance(part, dict))


def is_llm_configured() -> bool:
    return bool(settings.LLM_API_KEY and settings.LLM_BASE_URL and settings.LLM_MODEL)


def generate_questions_from_text(text: str, config: dict) -> list[dict]:
    """Ask the configured chat model for MCQs based on `text`, then validate/normalise."""
    count = max(1, min(100, int(config.get("numberOfQuestions", 10))))
    options_count = max(2, min(6, int(config.get("numberOfOptions", 4))))
    marks = config.get("marksPerQuestion", 1)

    prompt = _SYSTEM_PROMPT.format(
        count=count, options_count=options_count, marks=marks
    ) + _INSTRUCTION.format(text=text[:40_000])

    payload = {
        "model": settings.LLM_MODEL,
        "temperature": 0.4,
        "max_tokens": 60 + count * 220,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    response = httpx.post(
        f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions",
        json=payload,
        headers=headers,
        timeout=180.0,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    raw_questions = _parse_questions(content)
    if not raw_questions:
        raise ValueError("LLM returned no questions")

    questions = [_normalise_question(q, config) for q in raw_questions[:count]]
    logger.info("Generated %s questions via LLM", len(questions))
    return questions


def _parse_questions(content: str) -> list[dict]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    cleaned = cleaned.strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        data = _extract_json_block(cleaned)
    if isinstance(data, list):
        return [q for q in data if isinstance(q, dict)]
    if isinstance(data, dict):
        nested = data.get("questions")
        if isinstance(nested, list):
            return [q for q in nested if isinstance(q, dict)]
        if isinstance(data.get("data"), list):
            return [q for q in data["data"] if isinstance(q, dict)]
    return []


def _extract_json_block(text: str) -> Any:
    """Fallback: pull the first balanced JSON object/array out of a noisy response."""
    for open_char, close_char in (("[", "]"), ("{", "}")):
        start = text.find(open_char)
        if start == -1:
            continue
        depth = 0
        in_string = False
        escape = False
        for i, ch in enumerate(text[start:], start=start):
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == open_char:
                depth += 1
            elif ch == close_char:
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        break
    return None


def _normalise_question(raw: dict, config: dict) -> dict:
    raw_options = raw.get("options") or []
    options: list = []
    for option in raw_options:
        if isinstance(option, dict):
            if str(option.get("text") or "").strip() or option.get("image"):
                options.append(option)
        elif str(option).strip():
            options.append(str(option).strip())
    options = options[:6]
    while len(options) < 2:
        options.append(f"Option {len(options) + 1}")

    try:
        correct = int(raw.get("correct_answer", 0))
    except (TypeError, ValueError):
        correct = 0
    if correct < 0 or correct >= len(options):
        correct = 0

    try:
        marks = float(raw.get("marks") or config.get("marksPerQuestion", 1))
    except (TypeError, ValueError):
        marks = 1

    difficulty = str(raw.get("difficulty", config.get("difficulty", "medium"))).lower()
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"

    return {
        "question": str(raw.get("question", "")).strip(),
        "question_image": str(
            raw.get("question_image", "") or raw.get("questionImage", "")
        ).strip(),
        "options": options,
        "correct_answer": correct,
        "explanation": str(raw.get("explanation", "")).strip(),
        "marks": marks,
        "difficulty": difficulty,
        "topic": str(raw.get("topic", "")).strip(),
        "has_answer": bool(raw.get("has_answer", True)),
        "needs_review": False,
        "missing_figure": False,
        "source_page": raw.get("source_page"),
    }


def extract_page_questions(
    markdown: str,
    page_number: int,
    images: list[dict],
    config: dict,
) -> list[dict]:
    """Copy the MCQs printed on one document page, verbatim, via Gemini.

    `images` are ``{"url", "path"}`` figures from the same page, sent as
    vision inputs so figure stems and image options survive. Returns
    normalised question dicts with image refs resolved to media URLs.
    Raises when the model returns no questions.
    """
    from pathlib import Path

    text_part = (
        f"{_EXTRACT_SYSTEM_PROMPT}\n\nSOURCE MATERIAL (page {page_number}):\n{markdown[:20_000]}"
    )
    parts: list[dict] = [{"text": text_part}]
    figure_urls: list[str] = []
    for figure in images:
        figure_path = Path(figure.get("path", ""))
        if not figure_path.exists():
            continue
        parts.append(_gemini_image_part(figure_path.read_bytes(), figure_path.suffix))
        figure_urls.append(figure.get("url", ""))
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 8192},
    }
    content = _gemini_text(_gemini_request(payload))
    raw_questions = _parse_questions(content)
    questions = []
    for raw in raw_questions:
        if not raw.get("question"):
            continue
        question = _normalise_question(raw, config)
        question["source_page"] = page_number
        question_image_ref = raw.get("question_image_ref")
        if isinstance(question_image_ref, int) and 1 <= question_image_ref <= len(figure_urls):
            question["question_image"] = figure_urls[question_image_ref - 1]
        resolved_options = []
        for option in question["options"]:
            if isinstance(option, dict) and "image_ref" in option:
                ref = option.get("image_ref")
                text = str(option.get("text") or "").strip() or "Figure"
                if isinstance(ref, int) and 1 <= ref <= len(figure_urls):
                    resolved_options.append({"text": text, "image": figure_urls[ref - 1]})
                else:
                    resolved_options.append(text)
            else:
                resolved_options.append(option)
        question["options"] = resolved_options
        if not question["has_answer"]:
            question["needs_review"] = True
        if not question["question_image"] and stem_references_figure(question["question"]):
            question["missing_figure"] = True
        questions.append(question)
    if not questions:
        raise ValueError(f"Gemini returned no questions for page {page_number}")
    logger.info("Extracted %s verbatim questions from page %s", len(questions), page_number)
    return questions
