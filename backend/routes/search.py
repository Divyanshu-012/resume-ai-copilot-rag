from fastapi import APIRouter

from schemas.models import SemanticSearchRequest, SemanticSearchResponse, SearchResult
from services.embedding_service import semantic_search

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/semantic", response_model=SemanticSearchResponse)
async def search_semantic(payload: SemanticSearchRequest) -> SemanticSearchResponse:
    response = semantic_search(
        query=payload.query,
        top_k=payload.top_k,
        resume_id=payload.resume_id,
    )

    return SemanticSearchResponse(
        query=response["query"],
        results=[SearchResult(**item) for item in response["results"]],
    )
