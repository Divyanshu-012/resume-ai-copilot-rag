from fastapi import APIRouter, Body

from schemas.models import (
    ChatResumeRequest,
    ChatResumeResponse,
    RagChunk,
    RagSource,
)
from services.chat_service import chat_with_resume

router = APIRouter(tags=["chat"])


@router.post(
    "/chat-resume",
    response_model=ChatResumeResponse,
    summary="Chat with a resume using RAG",
    response_description="A Groq-generated answer grounded only in retrieved resume chunks",
)
async def chat_resume(
    payload: ChatResumeRequest = Body(
        ...,
        openapi_examples={
            "experience_question": {
                "summary": "Ask about candidate experience",
                "value": {
                    "resume_id": "a1b2c3d4e5f67890",
                    "question": "What FastAPI and RAG experience does this candidate have?",
                },
            },
            "education_question": {
                "summary": "Ask about education",
                "value": {
                    "resume_id": "a1b2c3d4e5f67890",
                    "question": "What education is listed on this resume?",
                },
            },
        },
    ),
) -> ChatResumeResponse:
    result = chat_with_resume(
        resume_id=payload.resume_id,
        question=payload.question,
    )

    return ChatResumeResponse(
        answer=result["answer"],
        rag_context=[RagChunk(**item) for item in result["rag_context"]],
        sources=[RagSource(**item) for item in result["sources"]],
    )
