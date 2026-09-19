"""Generate MCQ questions from document text using an OpenAI-compatible chat API.

Any provider exposing a `/chat/completions` endpoint (OpenAI, Groq, OpenRouter,
Together, LM Studio, Ollama, ...) works by configuring:
  LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
"""

import json
import logging
import re
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
    }
