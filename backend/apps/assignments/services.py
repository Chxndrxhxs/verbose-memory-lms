import logging
import re

from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from .extraction import (
    extract_document_markdown,
    extract_document_pages,
    split_answer_key,
    split_markdown_pages,
)
from .llm import (
    GeminiRateLimitedError,
    extract_page_questions,
    generate_questions_from_text,
    is_llm_configured,
)
from .models import (
    Assignment,
    AssignmentAttempt,
    AssignmentModel,
    AssignmentModelStep,
    AssignmentQuestion,
    AssignmentResult,
)

logger = logging.getLogger(__name__)

# Bound the number of LLM calls per generation request; pages beyond this are
# grouped into chunks so image-to-question mapping stays deterministic.
MAX_GENERATION_CHUNKS = 12

DEFAULT_SECURITY = {
    "fullscreen": False,
    "camera": True,
    "microphone": False,
    "block_tab_switch": True,
    "block_copy": True,
    "block_paste": True,
    "block_right_click": True,
    "block_shortcuts": True,
    "violations_before_auto_submit": 3,
}

DEFAULT_RESULTS = {
    "instant_result": True,
    "show_marks": True,
    "show_correct_answers": True,
    "show_explanations": True,
}

# ---------------------------------------------------------------------------
# Duration calculation
# ---------------------------------------------------------------------------


def node_duration_seconds(node: AssignmentModelStep) -> int:
    """Duration of one step. Leaf steps use their explicit duration; parents sum (sequential)
    or take the max (parallel) over children according to the model execution mode."""
    children = list(node.children.all())
    if not children:
        return max(1, node.duration_seconds)
    child_durations = [node_duration_seconds(c) for c in children]
    mode = node.model.execution_mode
    if mode == AssignmentModel.ExecutionMode.PARALLEL:
        return max(child_durations)
    return sum(child_durations)


def model_duration_seconds(model: AssignmentModel) -> int:
    root_steps = list(model.steps.filter(parent__isnull=True))
    durations = [node_duration_seconds(step) for step in root_steps]
    if model.execution_mode == AssignmentModel.ExecutionMode.PARALLEL:
        return max(durations, default=0)
    return sum(durations)


def format_duration_hms(total_seconds: int) -> str:
    hours, rem = divmod(int(total_seconds), 3600)
    minutes, seconds = divmod(rem, 60)
    if hours and minutes:
        return f"{hours}h {minutes}m"
    if hours:
        return f"{hours}h"
    if minutes:
        return f"{minutes}m"
    return f"{seconds}s"


# ---------------------------------------------------------------------------
# Assignment structure management
# ---------------------------------------------------------------------------


@transaction.atomic
def replace_assignment_structure(assignment: Assignment, models_payload: list[dict]) -> None:
    """Replace all models/steps/questions of an assignment from the wizard payload.

    Each model payload is:
      {code, name, description, execution_mode, is_published,
       steps: [{kind, name, description, duration_seconds, children: [...], questions: [...]}]}
    Leaf steps carry questions; question payloads include correct_answer etc.
    """
    assignment.models.all().delete()
    for position, model_payload in enumerate(models_payload):
        model = AssignmentModel.objects.create(
            assignment=assignment,
            code=model_payload.get("code", f"Model {position + 1}"),
            name=model_payload.get("name", f"Model {position + 1}"),
            description=model_payload.get("description", ""),
            execution_mode=model_payload.get(
                "execution_mode", AssignmentModel.ExecutionMode.SEQUENTIAL
            ),
            is_published=bool(model_payload.get("is_published", True)),
            position=position,
        )
        _replace_steps(model, None, model_payload.get("steps", []))


def _replace_steps(
    model: AssignmentModel, parent: AssignmentModelStep | None, steps_payload: list[dict]
) -> None:
    for index, step_payload in enumerate(steps_payload):
        step = AssignmentModelStep.objects.create(
            model=model,
            parent=parent,
            kind=step_payload.get("kind", AssignmentModelStep.Kind.TEST),
            name=step_payload.get("name", f"Step {index + 1}"),
            description=step_payload.get("description", ""),
            duration_seconds=int(step_payload.get("duration_seconds", 900)),
            position=index,
        )
        for q_index, q_payload in enumerate(step_payload.get("questions", [])):
            raw_options = q_payload.get("options", ["", "", "", ""]) or []
            options = []
            for option in raw_options:
                if isinstance(option, str):
                    options.append(option)
                elif isinstance(option, dict):
                    options.append(
                        {"text": option.get("text", ""), "image": option.get("image", "")}
                    )
                else:
                    options.append(str(option))
            AssignmentQuestion.objects.create(
                assignment=model.assignment,
                step=step,
                question=q_payload.get("question", ""),
                question_image=q_payload.get("question_image", ""),
                options=options,
                correct_answer=int(q_payload.get("correct_answer", 0)),
                explanation=q_payload.get("explanation", ""),
                marks=q_payload.get("marks", 1),
                difficulty=q_payload.get("difficulty", "medium"),
                topic=q_payload.get("topic", ""),
                position=q_index,
            )
        _replace_steps(model, step, step_payload.get("children", []))


def save_assignment_fields(assignment: Assignment | None, payload: dict, user) -> Assignment:
    """Create or update an assignment (top-level fields only - not models)."""
    from .extraction import document_file_id

    defaults = {k: payload[k] for k in payload if k not in ("models", "steps", "questions")}
    if defaults.get("access") is None:
        defaults["access"] = {}
    if defaults.get("source_document") and not defaults.get("source_document_file_id"):
        try:
            defaults["source_document_file_id"] = document_file_id(defaults["source_document"])
        except ValueError:
            defaults["source_document_file_id"] = ""
    if not assignment:
        assignment = Assignment(created_by=user, **defaults)
    else:
        for key, value in defaults.items():
            setattr(assignment, key, value)
    assignment.save()
    return assignment


# ---------------------------------------------------------------------------
# Canonical JSON payloads for the frontends
# ---------------------------------------------------------------------------


def step_builder(step: AssignmentModelStep) -> dict:
    """Serialise a step with its computed duration for the UI."""
    children = [step_builder(c) for c in step.children.all()]
    return {
        "id": step.id,
        "kind": step.kind,
        "name": step.name,
        "description": step.description,
        "duration_seconds": node_duration_seconds(step),
        "position": step.position,
        "children": children,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "question_image": q.question_image,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "marks": str(q.marks),
                "difficulty": q.difficulty,
                "topic": q.topic,
            }
            for q in step.questions.order_by("position", "id")
        ],
    }


def model_payload(model: AssignmentModel, include_questions: bool = True) -> dict:
    leaf_steps = collect_leaf_steps(model)
    step_ids = [step.id for step in leaf_steps]
    counts = (
        AssignmentQuestion.objects.filter(step_id__in=step_ids)
        .values("step_id")
        .annotate(total=Count("id"))
    )
    total_questions = sum(row["total"] for row in counts)
    return {
        "id": model.id,
        "code": model.code,
        "name": model.name,
        "description": model.description,
        "execution_mode": model.execution_mode,
        "is_published": model.is_published,
        "position": model.position,
        "duration_seconds": model_duration_seconds(model),
        "total_questions": total_questions,
        "steps": [step_builder(step) for step in model.steps.all()],
    }


def model_preview(model: AssignmentModel) -> dict:
    """Compact model summary for list cards / model picker (no heavy steps)."""
    leaf_steps = collect_leaf_steps(model)
    step_ids = [step.id for step in leaf_steps]
    total_questions = AssignmentQuestion.objects.filter(step_id__in=step_ids).count()
    return {
        "id": model.id,
        "code": model.code,
        "name": model.name,
        "description": model.description,
        "execution_mode": model.execution_mode,
        "is_published": model.is_published,
        "duration_seconds": model_duration_seconds(model),
        "duration_label": format_duration_hms(model_duration_seconds(model)),
        "total_questions": total_questions,
    }


def assignment_payload(assignment: Assignment, include_models: bool = True) -> dict:
    data = {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "instructions": assignment.instructions,
        "difficulty": assignment.difficulty,
        "status": assignment.status,
        "access_type": assignment.access_type,
        "access": assignment.access,
        "security": assignment.security or dict(DEFAULT_SECURITY),
        "results": assignment.results or dict(DEFAULT_RESULTS),
        "marks_per_correct": str(assignment.marks_per_correct),
        "negative_marking": assignment.negative_marking,
        "negative_marks_per_wrong": str(assignment.negative_marks_per_wrong),
        "marks_unanswered": str(assignment.marks_unanswered),
        "passing_percentage": str(assignment.passing_percentage),
        "max_attempts": assignment.max_attempts,
        "randomize_questions": assignment.randomize_questions,
        "randomize_options": assignment.randomize_options,
        "start_date": assignment.start_date.isoformat() if assignment.start_date else None,
        "end_date": assignment.end_date.isoformat() if assignment.end_date else None,
        "created_by": {
            "id": assignment.created_by_id,
            "name": getattr(assignment.created_by, "username", ""),
            "role": getattr(assignment.created_by, "role", ""),
        }
        if assignment.created_by
        else None,
        "created_at": assignment.created_at.isoformat(),
        "updated_at": assignment.updated_at.isoformat(),
        "published_at": assignment.published_at.isoformat() if assignment.published_at else None,
        "source_document": assignment.source_document,
        "source_document_name": assignment.source_document_name,
        "source_document_file_id": assignment.source_document_file_id,
        "draft_data": assignment.draft_data,
        "inter_category": {
            "id": assignment.inter_category.id,
            "name": assignment.inter_category.name,
            "sub_category": {
                "id": assignment.inter_category.sub_category.id,
                "name": assignment.inter_category.sub_category.name,
                "category": {
                    "id": assignment.inter_category.sub_category.category.id,
                    "name": assignment.inter_category.sub_category.category.name,
                },
            },
        }
        if assignment.inter_category
        else None,
        "course": None,
        "questions_count": assignment.questions.count(),
    }
    if assignment.course_id:
        data["course"] = {"id": assignment.course.id, "title": assignment.course.title}
    assignment_models = list(
        assignment.models.prefetch_related("steps", "steps__children", "steps__questions")
    )
    models = [model_payload(model) for model in assignment_models]
    if include_models:
        data["models"] = models
    data["models_preview"] = [model_preview(model) for model in assignment_models]
    published_durations = [
        model_duration_seconds(model) for model in assignment_models if model.is_published
    ]
    data["duration_seconds"] = max(published_durations) if published_durations else 0
    data["duration_label"] = format_duration_hms(data["duration_seconds"])
    return data


def category_tree_payload(include_assignments: bool = False) -> list[dict]:
    """Active category tree for the learner catalog: Category -> Sub Category -> Inter Category."""
    from .models import Category

    tree = []
    for cat in Category.objects.filter(is_active=True).order_by("position", "name"):
        subs = []
        for sub in cat.subcategories.filter(is_active=True).order_by("position", "name"):
            inters = []
            for inter in sub.intercategories.filter(is_active=True).order_by("position", "name"):
                item = {
                    "id": inter.id,
                    "name": inter.name,
                    "position": inter.position,
                    "assignments_count": Assignment.objects.filter(
                        inter_category=inter, status=Assignment.Status.PUBLISHED
                    ).count(),
                }
                if include_assignments:
                    items = Assignment.objects.filter(
                        inter_category=inter, status=Assignment.Status.PUBLISHED
                    ).select_related("created_by")
                    item["assignments"] = [
                        assignment_payload(a, include_models=False) for a in items
                    ]
                inters.append(item)
            subs.append(
                {
                    "id": sub.id,
                    "name": sub.name,
                    "position": sub.position,
                    "intercategories": inters,
                }
            )
        tree.append(
            {"id": cat.id, "name": cat.name, "position": cat.position, "subcategories": subs}
        )
    return tree


# ---------------------------------------------------------------------------
# Question generation (deterministic template bank - no external AI dependency)
# ---------------------------------------------------------------------------

_TOPIC_TEMPLATES = {
    "default": [
        (
            "Which statement best describes the core idea of {topic}?",
            [
                "It focuses on practical applications only",
                "It establishes foundational concepts and their relationships",
                "It is unrelated to real-world usage",
                "It only applies to small problems",
            ],
            1,
        ),
        (
            "What is a key benefit of understanding {topic}?",
            [
                "Improved problem-solving accuracy",
                "Longer code",
                "No practical advantages",
                "Reduced readability",
            ],
            0,
        ),
        (
            "Which of the following is a common misconception about {topic}?",
            [
                "It has no learning curve",
                "It requires discipline to master",
                "it has structured concepts",
                "It builds on previous knowledge",
            ],
            0,
        ),
        (
            "In the context of {topic}, which approach is generally preferred?",
            [
                "Following well-established patterns",
                "Skipping fundamentals",
                "Avoiding best practices",
                "Random experimentation",
            ],
            0,
        ),
        (
            "What should you do first when learning {topic}?",
            [
                "Master the fundamentals",
                "Ignore theory completely",
                "Memorize without practice",
                "Jump to advanced cases",
            ],
            0,
        ),
        (
            "Which tool best supports hands-on practice of {topic}?",
            [
                "Documentation and small exercises",
                "Guessing answers",
                "Delaying all practice",
                "Avoiding feedback",
            ],
            0,
        ),
    ],
}


def generate_questions(config: dict) -> list[dict]:
    """Return generated MCQ questions (not persisted)."""
    count = max(1, min(100, int(config.get("numberOfQuestions", 10))))
    difficulty = config.get("difficulty", "medium")
    marks = config.get("marksPerQuestion", 1)
    options_count = int(config.get("numberOfOptions", 4))
    explanations = bool(config.get("generateExplanations", True))

    distribution = config.get("topicDistribution") or {}
    topic_names = [
        t for t, n in sorted(distribution.items(), key=lambda kv: kv[1], reverse=True) if n > 0
    ]
    generated: list[dict] = []
    cursor = 0
    while len(generated) < count:
        topic = (
            topic_names[cursor % max(1, len(topic_names))]
            if topic_names
            else f"Topic {cursor % 4 + 1}"
        )
        cursor += 1
        templates = _TOPIC_TEMPLATES.get("default")
        template = templates[len(generated) % len(templates)]
        text, options, correct = template
        options = options[:options_count]
        while len(options) < options_count:  # pad if a model wants more choices
            options.append(f"Option {len(options) + 1}")
        qid = f"q_{len(generated) + 1}"
        if explanations:
            explanation = (
                f"{text} {options[correct]} is the correct choice because it aligns "
                "with the key concept."
            )
        else:
            explanation = ""
        generated.append(
            {
                "id": qid,
                "question": text.format(topic=topic),
                "question_image": "",
                "options": options,
                "correct_answer": correct,
                "explanation": explanation,
                "marks": marks,
                "difficulty": difficulty,
                "topic": topic,
            }
        )
    return generated


def regenerate_question(source: dict) -> dict:
    config = {
        "numberOfQuestions": 1,
        "difficulty": source.get("difficulty", "medium"),
        "marksPerQuestion": 1,
        "numberOfOptions": max(3, len(source.get("options", []))),
        "generateExplanations": bool(source.get("explanation")),
        "topicDistribution": {source.get("topic", "Topic"): 1} if source.get("topic") else {},
    }
    question = generate_questions(config)[0]
    return {**question, "question_image": source.get("question_image", "")}


def generate_questions_from_document(config: dict) -> list[dict]:
    """Generate questions from the uploaded source document.

    Works page-by-page so images extracted from the PDF stay attached to the
    questions they came from:
      * every question picks up a ``question_image`` (media URL) from its page,
      * a page with two or more figures contributes an image-choice question
        whose options ARE those figures.

    Uses the configured LLM when a source document is provided (one call per
    chunk of pages). Falls back to the deterministic template bank when there is
    no document, no LLM key, or the LLM/extraction fails, so generation never
    breaks the instructor flow.
    """
    source_document = str(config.get("source_document") or "").strip()
    if not source_document:
        return generate_questions(config)

    try:
        pages = extract_document_pages(source_document)
    except Exception:
        logger.warning("Document extraction failed; using template bank", exc_info=True)
        return generate_questions(config)
    text_pages = [p for p in pages if p["text"].strip()]
    if not text_pages:
        return generate_questions(config)

    chunks = _group_pages(text_pages)
    total_count = max(1, min(100, int(config.get("numberOfQuestions", 10))))
    weights = [len(c["text"]) for c in chunks]
    counts = _distribute_counts(len(chunks), total_count, weights)

    generated: list[dict] = []
    for chunk, count in zip(chunks, counts, strict=False):
        if count <= 0:
            continue
        for question in _generate_for_chunk(chunk, count, config):
            generated.append(question)
    return generated


def _group_pages(pages: list[dict]) -> list[dict]:
    """Group adjacent PDF pages so at most MAX_GENERATION_CHUNKS LLM calls run.

    Pages are joined text-first; the images of every page in the group are kept
    in reading order so image attachment stays deterministic.
    """
    if len(pages) <= MAX_GENERATION_CHUNKS:
        return [{"page": p["page"], "text": p["text"], "images": p["images"]} for p in pages]
    chunk_size = -(-len(pages) // MAX_GENERATION_CHUNKS)
    chunks: list[dict] = []
    for start in range(0, len(pages), chunk_size):
        group = pages[start : start + chunk_size]
        chunks.append(
            {
                "page": group[0]["page"],
                "text": "\n".join(p["text"] for p in group),
                "images": [img for p in group for img in p["images"]],
            }
        )
    return chunks


def _generate_for_chunk(chunk: dict, count: int, config: dict) -> list[dict]:
    topic = _chunk_topic(chunk["text"])
    page_config = {
        **config,
        "numberOfQuestions": count,
        "topicDistribution": {topic: count},
    }
    questions: list[dict] = []
    if is_llm_configured():
        try:
            questions = generate_questions_from_text(chunk["text"], config)[:count]
        except Exception:
            logger.warning("LLM generation failed; using template bank", exc_info=True)
    if not questions:
        questions = generate_questions(page_config)
    return _attach_images(questions, chunk, topic)


def _attach_images(questions: list[dict], chunk: dict, topic: str) -> list[dict]:
    """Attach this page's figures to its questions (and turn one into figure options)."""
    images = [img["url"] for img in chunk.get("images", [])]
    if not images:
        return [{**q, "question_image": ""} for q in questions]
    if len(images) >= 2 and questions:
        base = questions[-1]
        questions = questions[:-1]
        questions.append(
            {
                **base,
                "topic": topic[:120] or base.get("topic", ""),
                "question": f"Which of the following figures best represents “{topic[:60]}”?",
                "question_image": images[0],
                "options": [
                    {"text": f"Figure {i + 1}", "image": url} for i, url in enumerate(images)
                ],
                "correct_answer": 0,
                "explanation": (
                    "The first figure is the diagram that appears in the source "
                    "material for this topic."
                ),
            }
        )
    return [
        {**q, "question_image": images[index % len(images)]} for index, q in enumerate(questions)
    ]


def _chunk_topic(text: str) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return "Source Passage"
    sentence = re.split(r"[.?!\n]", clean)[0].strip()
    if len(sentence) > 60:
        sentence = sentence[:57].rstrip() + "..."
    return sentence or "Source Passage"


def _distribute_counts(total_pages: int, total_count: int, weights: list[int]) -> list[int]:
    """Split a question count across pages, weighted by text length."""
    counts = [0] * total_pages
    if total_pages <= 0 or total_count <= 0:
        return counts
    safe = weights if len(weights) == total_pages else [1] * total_pages
    total_weight = sum(safe)
    if total_weight <= 0:
        safe = [1] * total_pages
        total_weight = total_pages
    raw = [total_count * w / total_weight for w in safe]
    counts = [int(share) for share in raw]
    diff = total_count - sum(counts)
    order = sorted(range(total_pages), key=lambda i: raw[i] - counts[i], reverse=True)
    cursor = 0
    while diff > 0:
        counts[order[cursor % total_pages]] += 1
        diff -= 1
        cursor += 1
    diff = total_count - sum(counts)
    cursor = 0
    while diff < 0:
        if sum(counts) == 0:
            break
        index = max(range(total_pages), key=lambda i: counts[i])
        counts[index] -= 1
        diff += 1
    return counts


def regenerate_options(source: dict) -> dict:
    base = regenerate_question(source)
    new_options = base["options"]
    return {**source, "options": new_options, "correct_answer": base["correct_answer"]}


def extract_document_questions(config: dict) -> dict:
    """Copy the MCQs already printed in the uploaded document, verbatim.

    Pipeline: MarkItDown markdown (structure) + pypdf figures (pixels) ->
    Gemini verbatim structuring per page, with figures as vision inputs so
    figure stems and image options survive. Questions without a printed
    answer are flagged ``needs_review`` instead of guessing.

    Returns an envelope so the UI can resume after rate limits:
    ``{"questions": [...], "done_pages": [...], "pending_pages": [...],
    "total_pages": N}``. Pass ``done_pages``/``pending_pages`` back in
    ``config`` to continue a partial run instead of starting over.

    Set ``config["async_mode"]`` to enqueue a background job instead: returns
    ``{"job_id", "status"}`` immediately and the client polls
    ``GET admin/assignments/extract-jobs/<id>`` for progress.
    """
    if config.get("async_mode"):
        from . import extract_jobs

        job = extract_jobs.enqueue(dict(config))
        return {"job_id": job["job_id"], "status": job["status"]}
    source_document = str(config.get("source_document") or "").strip()
    if not source_document:
        raise ValueError("Upload a question paper first")
    if not is_llm_configured():
        raise ValueError("Connect a Gemini API key to extract PDF questions")
    try:
        markdown = extract_document_markdown(source_document)
    except FileNotFoundError:
        raise
    except Exception as exc:
        raise ValueError(f"Could not read the uploaded document: {exc}") from exc
    if not markdown.strip():
        raise ValueError("No readable text found in the uploaded document")
    try:
        pages = extract_document_pages(source_document)
    except FileNotFoundError:
        raise
    except Exception as exc:
        raise ValueError(f"Could not read the uploaded document: {exc}") from exc
    markdown, answer_key = split_answer_key(markdown)
    body_pages = [page for page in pages if "answer key" not in page["text"].lower()]
    ordered = body_pages or pages
    md_body_pages = split_markdown_pages(markdown)
    if len(md_body_pages) == len(ordered):
        source_pages = md_body_pages
    else:
        logger.warning(
            "MarkItDown returned %s chunks for %s pages; using pypdf text",
            len(md_body_pages),
            len(ordered),
        )
        source_pages = [page["text"] for page in ordered]
    if answer_key:
        markdown_pages = [
            f"{text}\n\n{answer_key}" if text.strip() else text for text in source_pages
        ]
    else:
        markdown_pages = source_pages
    questions: list[dict] = []
    done_pages: list[int] = []
    skipped_pages: list[int] = []
    resume_pages = config.get("pending_pages") or config.get("done_pages")
    only_pages = {int(page) for page in resume_pages} if resume_pages is not None else None
    for index, page in enumerate(ordered):
        if only_pages is not None and page["page"] not in only_pages:
            continue
        page_markdown = (markdown_pages[index] or page["text"]).strip()
        if not page_markdown and not page["images"]:
            continue
        try:
            questions.extend(
                extract_page_questions(page_markdown, page["page"], page["images"], config)
            )
            done_pages.append(page["page"])
        except GeminiRateLimitedError as exc:
            pending = [p["page"] for p in ordered[index:]]
            logger.warning("Gemini rate-limited; pausing with %s pages pending", len(pending))
            return {
                "questions": questions,
                "done_pages": done_pages,
                "pending_pages": pending,
                "skipped_pages": skipped_pages,
                "total_pages": len(ordered),
                "rate_limited": True,
                "error": str(exc),
            }
        except Exception:
            skipped_pages.append(page["page"])
            logger.warning("Verbatim extraction failed for page %s", page["page"], exc_info=True)
    if not questions and not done_pages and not skipped_pages:
        raise ValueError(
            "No numbered questions with options found. "
            "Check the file has Q1, Q2... with (a)-(d) options, or use Generate mode."
        )
    return {
        "questions": questions,
        "done_pages": done_pages,
        "pending_pages": [],
        "skipped_pages": skipped_pages,
        "total_pages": len(ordered),
        "rate_limited": False,
    }


# ---------------------------------------------------------------------------
# Attempt lifecycle
# ---------------------------------------------------------------------------


def build_attempt_snapshot(assignment: Assignment, model: AssignmentModel) -> dict:
    """Freeze exactly what the learner sees: served options/shuffled order and the
    correct index *as displayed*. Grading always compares against this snapshot, so
    instructors may edit questions mid-attempt without breaking scoring, and
    question/option randomisation stays consistent end to end."""
    import random

    snapshot: dict[str, dict] = {}
    steps = collect_leaf_steps(model)
    for step in steps:
        qs = list(step.questions.order_by("position", "id"))
        in_order = qs
        if assignment.randomize_questions:
            in_order = list(qs)
            random.shuffle(in_order)
        step_snap: dict[str, dict] = {}
        for q in in_order:
            options = list(q.options)
            correct_index = int(q.correct_answer)
            if assignment.randomize_options:
                correct_text = options[correct_index]
                shuffled = list(options)
                random.shuffle(shuffled)
                options = shuffled
                correct_index = shuffled.index(correct_text)
            step_snap[str(q.id)] = {
                "options": options,
                "correct_answer": correct_index,
                "marks": float(q.marks),
            }
        snapshot[str(step.id)] = step_snap
    return snapshot


def take_structure(attempt: AssignmentAttempt) -> list[dict]:
    """The screen the learner answers against. Uses the snapshot order + options,
    and hides correct answers/explanations."""
    model = attempt.model
    snapshot = attempt.questions_snapshot or {}
    structure = []
    for step in model.steps.filter(parent__isnull=True):
        _append_take_step(structure, step, snapshot)
    return structure


def _append_take_step(structure: list, step: AssignmentModelStep, snapshot: dict) -> None:
    children = list(step.children.all())
    if children:
        for child in children:
            _append_take_step(structure, child, snapshot)
        return
    step_snap = snapshot.get(str(step.id), {})
    questions = []
    for q in step.questions.order_by("position", "id"):
        meta = step_snap.get(str(q.id))
        if meta is None:
            meta = {
                "options": list(q.options),
                "correct_answer": int(q.correct_answer),
                "marks": float(q.marks),
            }
        questions.append(
            {
                "id": q.id,
                "question": q.question,
                "question_image": q.question_image,
                "options": meta["options"],
                "marks": meta["marks"],
                "difficulty": q.difficulty,
                "topic": q.topic,
            }
        )
    structure.append(
        {
            "step_id": step.id,
            "name": step.name,
            "kind": step.kind,
            "duration_seconds": step.duration_seconds,
            "questions": questions,
        }
    )


def start_attempt(learner, assignment: Assignment, model: AssignmentModel) -> AssignmentAttempt:
    """Create a server-side attempt with a real server expiry time."""
    model = assignment.models.get(id=model.id, is_published=True)
    total_seconds = model_duration_seconds(model)
    attempt = AssignmentAttempt.objects.create(
        learner=learner,
        assignment=assignment,
        model=model,
        expires_at=timezone.now() + timezone.timedelta(seconds=total_seconds),
        total_questions=sum(len(step.questions.all()) for step in collect_leaf_steps(model)),
        questions_snapshot=build_attempt_snapshot(assignment, model),
    )
    logger.info("Attempt %s started for user %s", attempt.id, learner.mobile)
    return attempt


def save_attempt_answers(attempt: AssignmentAttempt, answers: dict) -> AssignmentAttempt:
    """Persist in-progress answers so a refresh/reconnect can restore them."""
    attempt.answers = answers or {}
    attempt.save(update_fields=["answers", "updated_at"])
    return attempt


def collect_leaf_steps(model: AssignmentModel) -> list[AssignmentModelStep]:
    leaves: list[AssignmentModelStep] = []

    def walk(node: AssignmentModelStep):
        children = list(node.children.all())
        if not children:
            leaves.append(node)
        else:
            for child in children:
                walk(child)

    for root in model.steps.filter(parent__isnull=True):
        root_children = list(root.children.all())
        if not root_children:
            leaves.append(root)
        else:
            for child in root_children:
                walk(child)
    return leaves


def compute_outcome(attempt: AssignmentAttempt, answers: dict) -> None:
    """Score answers (step_id -> {question_id: selected_index}) against the attempt
    snapshot (what the learner actually saw) and build the transcript."""
    assignment = attempt.assignment
    snapshot = attempt.questions_snapshot or {}
    steps = collect_leaf_steps(attempt.model)
    question_ids = [q.id for step in steps for q in step.questions.all()]
    live = {q.id: q for q in AssignmentQuestion.objects.filter(id__in=question_ids)}
    questions_by_step = {step.id: list(step.questions.all()) for step in steps}

    per_step: dict[int, dict] = {}
    total_questions = 0
    answered = 0
    correct = 0
    wrong = 0
    positive = 0
    negative = 0
    max_score = 0

    for step in steps:
        qs = questions_by_step.get(step.id) or []
        step_answers = (answers or {}).get(str(step.id), {})
        step_snap = snapshot.get(str(step.id), {})
        correct_in_step = 0
        attempted_in_step = 0
        for q in qs:
            fallback = live.get(q.id, q)
            meta = step_snap.get(str(q.id)) or {
                "correct_answer": int(fallback.correct_answer),
                "marks": float(fallback.marks),
            }
            marks = meta["marks"]
            total_questions += 1
            max_score += marks
            selected = step_answers.get(str(q.id))
            if selected is None:
                continue
            answered += 1
            attempted_in_step += 1
            if int(selected) == meta["correct_answer"]:
                correct += 1
                correct_in_step += 1
                positive += marks
            else:
                wrong += 1
                if assignment.negative_marking:
                    negative += float(assignment.negative_marks_per_wrong)
        per_step[step.id] = {
            "step_id": step.id,
            "name": step.name,
            "kind": step.kind,
            "questions": len(qs),
            "attempted": attempted_in_step,
            "correct": correct_in_step,
            "time_seconds": step.duration_seconds,
        }

    unanswered = total_questions - answered
    final_score = positive - negative
    max_total = max(max_score, 1)
    percentage = round((final_score / max_total) * 100, 2)

    attempt.total_questions = total_questions
    attempt.answered = answered
    attempt.correct = correct
    attempt.wrong = wrong
    attempt.unanswered = unanswered
    attempt.positive_marks = positive
    attempt.negative_marks = negative
    attempt.final_score = final_score
    attempt.max_score = max_score
    attempt.percentage = max(0.0, min(percentage, 100.0))
    attempt.passed = attempt.percentage >= float(assignment.passing_percentage)
    attempt.answers = answers or {}

    transcript = {
        "assignment": assignment.title,
        "category": getattr(assignment.inter_category.sub_category.category, "name", "")
        if assignment.inter_category
        else "",
        "sub_category": getattr(assignment.inter_category.sub_category, "name", "")
        if assignment.inter_category
        else "",
        "inter_category": assignment.inter_category.name if assignment.inter_category else "",
        "model": attempt.model.name,
        "model_code": attempt.model.code,
        "execution_mode": attempt.model.execution_mode,
        "model_duration_seconds": model_duration_seconds(attempt.model),
        "started_at": attempt.started_at.isoformat(),
        "steps": list(per_step.values()),
        "passed": attempt.passed,
    }
    attempt.transcript = transcript


def _finish(attempt: AssignmentAttempt, status: str, is_auto_submitted: bool) -> AssignmentAttempt:
    """Lock an attempt at its final state: compute outcome + persist transcript/result."""
    attempt.status = status
    attempt.is_auto_submitted = is_auto_submitted
    attempt.ended_at = attempt.ended_at or timezone.now()
    compute_outcome(attempt, attempt.answers)
    transcript = dict(attempt.transcript)
    transcript["ended_at"] = attempt.ended_at.isoformat()
    time_taken = max(0, int((attempt.ended_at - attempt.started_at).total_seconds()))
    transcript["time_taken_seconds"] = time_taken
    attempt.transcript = transcript
    attempt.save()
    AssignmentResult.objects.update_or_create(attempt=attempt, defaults={"transcript": transcript})
    return attempt


def submit_attempt(attempt: AssignmentAttempt, answers: dict) -> AssignmentAttempt:
    """Server-authoritative submission. Expired attempts are locked, never extended."""
    if attempt.status != AssignmentAttempt.Status.IN_PROGRESS:
        return attempt

    attempt.answers = answers or {}
    now = timezone.now()
    if now > attempt.expires_at:
        attempt.ended_at = attempt.expires_at
        status = AssignmentAttempt.Status.EXPIRED
        is_auto = True
    else:
        status = AssignmentAttempt.Status.COMPLETED
        is_auto = False
    return _finish(attempt, status, is_auto)


def grade_expired_attempts() -> int:
    """Grade all in-progress attempts whose server expiry passed (called by timer expiry path)."""
    expired_qs = AssignmentAttempt.objects.filter(
        status=AssignmentAttempt.Status.IN_PROGRESS, expires_at__lt=timezone.now()
    )
    count = 0
    for attempt in expired_qs:
        attempt.ended_at = attempt.expires_at
        _finish(attempt, AssignmentAttempt.Status.EXPIRED, True)
        count += 1
    return count
