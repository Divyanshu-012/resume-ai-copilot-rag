from typing import Any

from services.llm_service import generate_text
from services.rag_service import retrieve_context


def _format_rag_context(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "text": item["text"],
            "similarity": item.get("similarity"),
        }
        for item in results
    ]


def _format_sources(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": item.get("id"),
            "metadata": item.get("metadata", {}),
            "similarity": item.get("similarity"),
        }
        for item in results
    ]


def chat_with_resume(resume_id: str, question: str) -> dict[str, Any]:
    rag_results = retrieve_context(question, resume_id)
    rag_context = _format_rag_context(rag_results)
    sources = _format_sources(rag_results)
    context_text = "\n\n".join(
        f"[Chunk {index + 1} | similarity={item.get('similarity')}]\n{item['text']}"
        for index, item in enumerate(rag_context)
    )

    if not context_text.strip():
        return {
            "answer": "I could not find relevant resume information to answer that question.",
            "rag_context": rag_context,
            "sources": sources,
        }

    answer = generate_text(
        system_prompt=(
            "You are a resume Q&A assistant. Answer only using the retrieved resume context. "
            "Do not use outside knowledge, guesses, or assumptions. If the resume context does "
            "not contain the answer, say: \"I could not find that information in the resume context.\""
        ),
        user_prompt=(
            "Retrieved Resume Context:\n"
            f"{context_text[:7000]}\n\n"
            "Question:\n"
            f"{question[:1000]}\n\n"
            "Answer concisely and cite only facts present in the retrieved resume context."
        ),
        temperature=0.1,
    )

    return {
        "answer": answer,
        "rag_context": rag_context,
        "sources": sources,
    }
