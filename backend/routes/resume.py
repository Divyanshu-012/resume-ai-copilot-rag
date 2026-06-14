from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.models import IngestResponse
from services.embedding_service import store_resume_embeddings
from services.llm_service import extract_skills_from_text
from services.resume_parser import extract_text_from_pdf

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_resume(file: UploadFile = File(...)) -> IngestResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    filename = file.filename.lower()
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload PDF or TXT for now.",
        )

    if len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough resume text")

    embed_result = store_resume_embeddings(text)
    resume_id = embed_result.get("resumeId")
    if not resume_id:
        raise HTTPException(status_code=500, detail="Failed to store resume embeddings")

    skills = extract_skills_from_text(text, "resume")

    return IngestResponse(
        resume_id=resume_id,
        skills=skills,
        chunks=embed_result["chunks"],
        text_length=len(text),
        message=embed_result["message"],
    )
