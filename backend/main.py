from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from routes.ai import router as ai_router
from routes.analyze import router as analyze_router
from routes.chat import router as chat_router
from routes.interview import router as interview_router
from routes.resume import router as resume_router
from routes.search import router as search_router

settings = get_settings()

app = FastAPI(
    title="Resume AI Copilot API",
    description="GenAI backend with embeddings, vector search, and RAG",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router)
app.include_router(search_router)
app.include_router(analyze_router)
app.include_router(ai_router)
app.include_router(interview_router)
app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "resume-ai-backend"}


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "Resume AI Copilot backend running"}
