from typing import Any

from core.config import get_settings
from services.embedding_service import semantic_search
from services.llm_service import extract_skills_from_text, generate_text
from services.skill_service import semantic_skill_match


def _format_rag_context(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "text": item["text"],
            "similarity": item.get("similarity"),
        }
        for item in results
    ]


def retrieve_context(query: str, resume_id: str, top_k: int | None = None) -> list[dict[str, Any]]:
    settings = get_settings()
    response = semantic_search(
        query=query,
        top_k=top_k or settings.rag_top_k,
        resume_id=resume_id,
    )
    return response["results"]


def get_rag_skill_context(
    resume_id: str,
    jd: str,
    resume_skills: list[str] | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    rag_results = retrieve_context(jd, resume_id)
    rag_context = _format_rag_context(rag_results)
    context_text = "\n\n".join(item["text"] for item in rag_context)

    jd_skills = extract_skills_from_text(jd, "job description")
    skills = resume_skills or extract_skills_from_text(context_text or jd, "resume")
    match = semantic_skill_match(
        resume_skills=skills,
        jd_skills=jd_skills,
        threshold=settings.skill_similarity_threshold,
    )

    return {
        "rag_context": rag_context,
        "context_text": context_text,
        "jd_skills": jd_skills,
        "resume_skills": skills,
        "match": match,
    }


def analyze_application(
    resume_id: str,
    jd: str,
    resume_skills: list[str] | None = None,
) -> dict[str, Any]:
    context = get_rag_skill_context(resume_id, jd, resume_skills)
    match = context["match"]
    context_text = context["context_text"]

    analysis = generate_text(
        system_prompt=(
            "You are a senior technical recruiter. "
            "Explain resume-to-job fit using only the provided evidence."
        ),
        user_prompt=(
            "Analyze how well this candidate matches the role.\n\n"
            f"Job Description:\n{jd[:6000]}\n\n"
            f"Retrieved Resume Evidence:\n{context_text[:6000]}\n\n"
            f"Matched Skills: {', '.join(match['matched']) or 'None'}\n"
            f"Missing Skills: {', '.join(match['missing']) or 'None'}\n\n"
            "Write 3-5 concise bullet points covering strengths, gaps, and one actionable recommendation."
        ),
    )

    return {
        "resume_id": resume_id,
        "jd_skills": context["jd_skills"],
        "resume_skills": context["resume_skills"],
        "match": match,
        "rag_context": context["rag_context"],
        "analysis": analysis,
    }


def build_email_context(resume_id: str, jd: str) -> tuple[str, list[dict[str, Any]]]:
    rag_results = retrieve_context(jd, resume_id)
    rag_context = _format_rag_context(rag_results)
    context_text = "\n\n".join(item["text"] for item in rag_context)
    return context_text, rag_context


def build_suggestions_context(resume_id: str | None, jd: str) -> tuple[str, list[dict[str, Any]]]:
    if not resume_id:
        return "", []

    query = jd or "skills projects experience learning path"
    rag_results = retrieve_context(query, resume_id, top_k=3)
    rag_context = _format_rag_context(rag_results)
    context_text = "\n\n".join(item["text"] for item in rag_context)
    return context_text, rag_context
