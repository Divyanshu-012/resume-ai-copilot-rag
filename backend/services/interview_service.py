from typing import Any, Literal

from services.llm_service import generate_json
from services.rag_service import get_rag_skill_context

Difficulty = Literal["easy", "medium", "hard"]

_DIFFICULTY_GUIDANCE = {
    "easy": (
        "Focus on fundamentals, definitions, and straightforward experience checks. "
        "Questions should be approachable for early-career or screening rounds."
    ),
    "medium": (
        "Focus on applied scenarios, trade-offs, and past project decisions grounded "
        "in the candidate's resume evidence."
    ),
    "hard": (
        "Focus on deep technical reasoning, system design, edge cases, and probing "
        "gaps in missing skills with realistic senior-level follow-ups."
    ),
}


def _normalize_question(raw: dict[str, Any]) -> dict[str, str] | None:
    question = str(
        raw.get("question")
        or raw.get("Question")
        or ""
    ).strip()
    if not question:
        return None

    return {
        "question": question,
        "why_asked": str(
            raw.get("why_asked")
            or raw.get("why_it_was_asked")
            or raw.get("whyAsked")
            or ""
        ).strip(),
        "expected_answer_outline": str(
            raw.get("expected_answer_outline")
            or raw.get("expectedAnswerOutline")
            or raw.get("answer_outline")
            or ""
        ).strip(),
        "skill_evaluated": str(
            raw.get("skill_evaluated")
            or raw.get("skill_being_evaluated")
            or raw.get("skillEvaluated")
            or ""
        ).strip(),
    }


def _parse_questions(payload: Any, count: int) -> list[dict[str, str]]:
    if isinstance(payload, dict):
        raw_questions = payload.get("questions", [])
    elif isinstance(payload, list):
        raw_questions = payload
    else:
        raw_questions = []

    questions: list[dict[str, str]] = []
    for item in raw_questions:
        if not isinstance(item, dict):
            continue
        normalized = _normalize_question(item)
        if normalized:
            questions.append(normalized)
        if len(questions) >= count:
            break

    return questions[:count]


def prepare_interview(
    resume_id: str,
    job_description: str,
    difficulty: Difficulty,
    count: int,
) -> dict[str, Any]:
    context = get_rag_skill_context(resume_id, job_description)
    match = context["match"]
    matched_skills = match["matched"]
    missing_skills = match["missing"]
    context_text = context["context_text"]

    prompt = (
        f"Generate exactly {count} interview questions.\n\n"
        f"Difficulty: {difficulty}\n"
        f"{_DIFFICULTY_GUIDANCE[difficulty]}\n\n"
        "Ground every question in the provided job description and retrieved resume evidence. "
        "Mix questions across matched skills and missing skills when possible.\n\n"
        f"Matched Skills: {', '.join(matched_skills) or 'None'}\n"
        f"Missing Skills: {', '.join(missing_skills) or 'None'}\n\n"
        f"Job Description:\n{job_description[:6000]}\n\n"
        f"Retrieved Resume Evidence:\n{context_text[:6000]}\n\n"
        "Return ONLY valid JSON in this shape:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "question": "...",\n'
        '      "why_asked": "...",\n'
        '      "expected_answer_outline": "...",\n'
        '      "skill_evaluated": "..."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    generated = generate_json(
        system_prompt=(
            "You are an expert technical interviewer. "
            "Create realistic interview questions with clear evaluation intent. "
            "Return ONLY valid JSON."
        ),
        user_prompt=prompt,
        temperature=0.35,
    )

    questions = _parse_questions(generated, count)

    return {
        "resume_id": resume_id,
        "difficulty": difficulty,
        "count": len(questions),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "rag_context": context["rag_context"],
        "questions": questions,
    }
