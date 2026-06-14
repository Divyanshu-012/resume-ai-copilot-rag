from fastapi import APIRouter, Body

from schemas.models import InterviewPrepRequest, InterviewPrepResponse, InterviewQuestion, RagChunk
from services.interview_service import prepare_interview

router = APIRouter(tags=["interview"])


@router.post(
    "/interview-prep",
    response_model=InterviewPrepResponse,
    summary="Generate RAG-grounded interview questions",
    response_description="Interview questions grounded in resume evidence and job requirements",
)
async def interview_prep(
    payload: InterviewPrepRequest = Body(
        ...,
        openapi_examples={
            "medium_backend_role": {
                "summary": "Medium difficulty backend interview prep",
                "value": {
                    "resume_id": "a1b2c3d4e5f67890",
                    "job_description": (
                        "We are hiring a Backend Engineer with FastAPI, Python, "
                        "vector databases, and RAG experience to build GenAI services."
                    ),
                    "difficulty": "medium",
                    "count": 10,
                },
            },
            "hard_senior_role": {
                "summary": "Hard difficulty senior interview prep",
                "value": {
                    "resume_id": "a1b2c3d4e5f67890",
                    "job_description": (
                        "Senior ML Platform Engineer responsible for production RAG systems, "
                        "observability, and scalable retrieval infrastructure."
                    ),
                    "difficulty": "hard",
                    "count": 8,
                },
            },
        },
    ),
) -> InterviewPrepResponse:
    result = prepare_interview(
        resume_id=payload.resume_id,
        job_description=payload.job_description,
        difficulty=payload.difficulty,
        count=payload.count,
    )

    return InterviewPrepResponse(
        resume_id=result["resume_id"],
        difficulty=result["difficulty"],
        count=result["count"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        rag_context=[RagChunk(**item) for item in result["rag_context"]],
        questions=[InterviewQuestion(**item) for item in result["questions"]],
    )
