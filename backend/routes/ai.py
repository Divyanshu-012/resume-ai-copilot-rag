from fastapi import APIRouter

from schemas.models import EmailRequest, EmailResponse, RagChunk, SuggestionsRequest, SuggestionsResponse
from services.llm_service import generate_text
from services.rag_service import build_email_context, build_suggestions_context

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-email", response_model=EmailResponse)
async def generate_email(payload: EmailRequest) -> EmailResponse:
    context_text, rag_context = build_email_context(payload.resume_id, payload.jd)
    skills_text = ", ".join(payload.resume_skills)

    email = generate_text(
        system_prompt="You help job seekers write short recruiter cold emails.",
        user_prompt=(
            "Write a short recruiter cold email using the retrieved resume evidence.\n\n"
            f"Resume Skills:\n{skills_text}\n\n"
            f"Retrieved Resume Evidence:\n{context_text[:5000]}\n\n"
            f"Job Description:\n{payload.jd[:5000]}"
        ),
    )

    return EmailResponse(
        email=email,
        rag_context=[RagChunk(**item) for item in rag_context],
    )


@router.post("/suggestions", response_model=SuggestionsResponse)
async def generate_suggestions(payload: SuggestionsRequest) -> SuggestionsResponse:
    context_text, rag_context = build_suggestions_context(payload.resume_id, payload.jd)

    suggestions = generate_text(
        system_prompt="You are a helpful career mentor for software engineers.",
        user_prompt=(
            "A candidate is missing these skills:\n"
            f"{', '.join(payload.missing_skills)}\n\n"
            f"Job Description:\n{payload.jd[:4000]}\n\n"
            f"Retrieved Resume Evidence:\n{context_text[:4000]}\n\n"
            "Suggest practical ways to close these gaps quickly."
        ),
    )

    return SuggestionsResponse(
        suggestions=suggestions,
        rag_context=[RagChunk(**item) for item in rag_context],
    )
