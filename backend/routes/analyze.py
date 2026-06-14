from fastapi import APIRouter

from schemas.models import AnalyzeRequest, AnalyzeResponse, MatchResult, RagChunk
from services.rag_service import analyze_application

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    result = analyze_application(
        resume_id=payload.resume_id,
        jd=payload.jd,
        resume_skills=payload.resume_skills or None,
    )

    return AnalyzeResponse(
        resume_id=result["resume_id"],
        jd_skills=result["jd_skills"],
        resume_skills=result["resume_skills"],
        match=MatchResult(**result["match"]),
        rag_context=[RagChunk(**item) for item in result["rag_context"]],
        analysis=result["analysis"],
    )
