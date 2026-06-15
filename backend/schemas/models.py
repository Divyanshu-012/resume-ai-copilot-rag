from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SemanticSearchRequest(BaseModel):
    query: str
    resume_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    id: str | None
    text: str
    metadata: dict
    distance: float | None
    similarity: float | None


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


class AnalyzeRequest(BaseModel):
    jd: str
    resume_id: str
    resume_skills: list[str] = Field(default_factory=list)


class RagChunk(BaseModel):
    text: str
    similarity: float | None


class RagSource(BaseModel):
    id: str | None
    metadata: dict = Field(default_factory=dict)
    similarity: float | None


class ChatResumeRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "resume_id": "a1b2c3d4e5f67890",
                    "question": "What FastAPI and RAG experience does this candidate have?",
                }
            ]
        }
    )

    resume_id: str = Field(..., min_length=1, examples=["a1b2c3d4e5f67890"])
    question: str = Field(
        ...,
        min_length=3,
        examples=["What FastAPI and RAG experience does this candidate have?"],
    )


class ChatResumeResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "answer": (
                        "The resume mentions that the candidate built FastAPI services "
                        "with ChromaDB retrieval pipelines."
                    ),
                    "rag_context": [
                        {
                            "text": "Built FastAPI services with ChromaDB retrieval pipelines.",
                            "similarity": 0.84,
                        }
                    ],
                    "sources": [
                        {
                            "id": "a1b2c3d4e5f67890_chunk_3",
                            "metadata": {
                                "resume_id": "a1b2c3d4e5f67890",
                                "source": "resume",
                                "chunk_index": 3,
                            },
                            "similarity": 0.84,
                        }
                    ],
                }
            ]
        }
    )

    answer: str
    rag_context: list[RagChunk]
    sources: list[RagSource]


class MatchResult(BaseModel):
    score: int
    matched: list[str]
    missing: list[str]
    semantic_matches: list[dict[str, str]] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    resume_id: str
    jd_skills: list[str]
    resume_skills: list[str]
    match: MatchResult
    rag_context: list[RagChunk]
    analysis: str


class EmailRequest(BaseModel):
    resume_id: str
    jd: str
    resume_skills: list[str] = Field(default_factory=list)


class EmailResponse(BaseModel):
    email: str
    rag_context: list[RagChunk]


class SuggestionsRequest(BaseModel):
    missing_skills: list[str]
    jd: str = ""
    resume_id: str | None = None


class SuggestionsResponse(BaseModel):
    suggestions: str
    rag_context: list[RagChunk] = Field(default_factory=list)


class IngestResponse(BaseModel):
    resume_id: str
    skills: list[str]
    chunks: int
    text_length: int
    message: str


class InterviewPrepRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "resume_id": "a1b2c3d4e5f67890",
                    "job_description": (
                        "We are hiring a Backend Engineer with FastAPI, Python, "
                        "vector databases, and RAG experience to build GenAI services."
                    ),
                    "difficulty": "medium",
                    "count": 10,
                }
            ]
        }
    )

    resume_id: str = Field(..., min_length=1, examples=["a1b2c3d4e5f67890"])
    job_description: str = Field(..., min_length=20, examples=["Backend role requiring FastAPI and RAG"])
    difficulty: Literal["easy", "medium", "hard"] = Field(default="medium", examples=["medium"])
    count: int = Field(default=10, ge=1, le=20, examples=[10])


class InterviewQuestion(BaseModel):
    question: str
    why_asked: str
    expected_answer_outline: str
    skill_evaluated: str


class InterviewPrepResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "resume_id": "a1b2c3d4e5f67890",
                    "difficulty": "medium",
                    "count": 2,
                    "matched_skills": ["Python", "FastAPI"],
                    "missing_skills": ["Kubernetes"],
                    "rag_context": [
                        {
                            "text": "Built FastAPI services with ChromaDB retrieval pipelines.",
                            "similarity": 0.84,
                        }
                    ],
                    "questions": [
                        {
                            "question": "How did you design retrieval for your FastAPI RAG service?",
                            "why_asked": "Validates hands-on RAG architecture experience from the resume.",
                            "expected_answer_outline": (
                                "Explain chunking, embeddings, vector store choice, retrieval top-k, "
                                "and how context is passed to the LLM."
                            ),
                            "skill_evaluated": "RAG",
                        }
                    ],
                }
            ]
        }
    )

    resume_id: str
    difficulty: Literal["easy", "medium", "hard"]
    count: int
    matched_skills: list[str]
    missing_skills: list[str]
    rag_context: list[RagChunk]
    questions: list[InterviewQuestion]
