import json
import re
from typing import Any

from groq import Groq

from core.config import get_settings


def _client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.groq_api_key)


def _clean_json(raw: str) -> str:
    return re.sub(r"```json|```", "", raw or "").strip()


def _parse_json_array(raw: str) -> list[str]:
    cleaned = _clean_json(raw)
    try:
        parsed = json.loads(cleaned or "[]")
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass
    return []


def _parse_json_value(raw: str) -> Any:
    cleaned = _clean_json(raw)
    if not cleaned:
        return None
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def extract_skills_from_text(text: str, source: str) -> list[str]:
    settings = get_settings()
    completion = _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract technical skills from career documents. "
                    "Return ONLY a valid JSON array of skill strings."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Extract all technical skills from this {source}.\n\n"
                    'Return ONLY JSON like: ["JavaScript","React","FastAPI"]\n\n'
                    f"{source.title()}:\n{text[:12000]}"
                ),
            },
        ],
        temperature=0.1,
    )
    return _parse_json_array(completion.choices[0].message.content or "[]")


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> str:
    settings = get_settings()
    completion = _client().chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )
    return completion.choices[0].message.content or ""


def generate_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
) -> Any:
    raw = generate_text(system_prompt, user_prompt, temperature=temperature)
    return _parse_json_value(raw)
