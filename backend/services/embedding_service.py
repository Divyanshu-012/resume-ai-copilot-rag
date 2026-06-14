from hashlib import sha256
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

from core.config import get_settings

_settings = get_settings()
_model: SentenceTransformer | None = None
_client = chromadb.PersistentClient(path=str(_settings.vectorstore_path))
_collection = _client.get_or_create_collection(name="resume_embeddings")


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(_settings.embedding_model)
    return _model


def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    settings = get_settings()
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    cleaned_text = " ".join(text.split())
    if not cleaned_text:
        return []

    chunks: list[str] = []
    start = 0

    while start < len(cleaned_text):
        end = min(start + chunk_size, len(cleaned_text))
        chunks.append(cleaned_text[start:end])

        if end == len(cleaned_text):
            break

        start = max(end - overlap, start + 1)

    return chunks


def _resume_id(resume_text: str) -> str:
    return sha256(resume_text.encode("utf-8")).hexdigest()[:16]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    embeddings = _get_model().encode(texts)
    return [embedding.tolist() for embedding in embeddings]


def store_resume_embeddings(resume_text: str, source: str = "resume") -> dict[str, Any]:
    chunks = chunk_text(resume_text)

    if not chunks:
        return {
            "message": "No resume text found to embed",
            "chunks": 0,
            "resumeId": None,
        }

    resume_id = _resume_id(resume_text)
    embeddings = embed_texts(chunks)
    ids = [f"{resume_id}_chunk_{index}" for index in range(len(chunks))]
    metadatas = [
        {
            "resume_id": resume_id,
            "source": source,
            "chunk_index": index,
        }
        for index in range(len(chunks))
    ]

    _collection.upsert(
        documents=chunks,
        embeddings=embeddings,
        ids=ids,
        metadatas=metadatas,
    )

    return {
        "message": "Embeddings stored successfully",
        "chunks": len(chunks),
        "resumeId": resume_id,
    }


def semantic_search(
    query: str,
    top_k: int = 5,
    resume_id: str | None = None,
) -> dict[str, Any]:
    if not query.strip():
        return {"query": query, "results": []}

    query_embedding = embed_texts([query])[0]
    where_filter = {"resume_id": resume_id} if resume_id else None

    response = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=["documents", "distances", "metadatas"],
    )

    documents = response.get("documents", [[]])[0]
    distances = response.get("distances", [[]])[0]
    metadatas = response.get("metadatas", [[]])[0]
    ids = response.get("ids", [[]])[0]

    results: list[dict[str, Any]] = []

    for index, document in enumerate(documents):
        distance = distances[index] if index < len(distances) else None

        results.append(
            {
                "id": ids[index] if index < len(ids) else None,
                "text": document,
                "metadata": metadatas[index] if index < len(metadatas) else {},
                "distance": distance,
                "similarity": round(1 - distance, 4) if distance is not None else None,
            }
        )

    return {"query": query, "results": results}
