from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, Literal, Mapping

import google.generativeai as genai

from ..config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


class GeminiConfigurationError(RuntimeError):
    """Raised when the Gemini client is not configured correctly."""


class GeminiGenerationError(RuntimeError):
    """Raised when the Gemini API fails to generate a response."""


_SYSTEM_PROMPT = """You are an assistant generating productivity insights from structured FACTS.\nRules:\n- Only use provided FACTS. If data is missing, say \"unknown\" instead of guessing.\n- Keep outputs concise and actionable for a dashboard.\n- Prefer clear bullet points. Avoid flowery language.\n- Never invent tasks, habits, or numbers not present or derivable from FACTS."""

_DAILY_TASK = """Create a daily briefing with:\n1) Key changes vs. yesterday (tasks/habits/events)\n2) Today’s top priorities (<=3)\n3) Risk or blocker (if any)\n4) One concrete suggestion (<=1 sentence)\nReturn JSON: { \"speech\": string, \"bullets\": string[] }"""

_MONTHLY_TASK = """Create a monthly summary with:\n- Trends (task completions, habit frequency)\n- Best/worst weekdays and time windows\n- Missed/overdue patterns\n- Recommendations (max 3)\nReturn JSON: { \"summary\": string, \"bullets\": string[], \"recommendations\": string[] }"""


@dataclass(slots=True)
class _GeminiSession:
    model_name: str
    api_key: str
    _model: genai.GenerativeModel | None = None

    def get_model(self) -> genai.GenerativeModel:
        if not self.api_key:
            raise GeminiConfigurationError("GEMINI_API_KEY is not configured")

        if self._model is None:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
        return self._model


_session: _GeminiSession | None = None


def _get_session() -> _GeminiSession:
    global _session
    if _session is None:
        _session = _GeminiSession(model_name=GEMINI_MODEL, api_key=GEMINI_API_KEY or "")
    return _session


def _task_for_mode(mode: Literal["daily", "monthly"]) -> str:
    if mode == "daily":
        return _DAILY_TASK
    if mode == "monthly":
        return _MONTHLY_TASK
    raise ValueError(f"Unsupported insight mode: {mode}")


def _serialize_facts(facts: Mapping[str, Any]) -> str:
    return json.dumps(facts, separators=(",", ":"), ensure_ascii=False, sort_keys=True)


def _extract_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return text

    candidates = getattr(response, "candidates", []) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", []) if content else []
        for part in parts:
            part_text = getattr(part, "text", None)
            if part_text:
                return part_text
    raise GeminiGenerationError("Gemini response did not contain text content")


async def generate_insight(facts: Mapping[str, Any], mode: Literal["daily", "monthly"]) -> Dict[str, Any]:
    session = _get_session()
    try:
        model = session.get_model()
    except GeminiConfigurationError:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to initialise Gemini model")
        raise GeminiConfigurationError("Unable to initialise Gemini model") from exc

    payload = [
        {"role": "system", "parts": [{"text": _SYSTEM_PROMPT}]},
        {
            "role": "user",
            "parts": [
                {"text": _task_for_mode(mode)},
                {"text": "FACTS:"},
                {"text": _serialize_facts(facts)},
            ],
        },
    ]

    def _invoke() -> Dict[str, Any]:
        try:
            response = model.generate_content(
                payload,
                generation_config={"response_mime_type": "application/json"},
            )
        except Exception as exc:  # pragma: no cover - network failures
            logger.exception("Gemini generation failed")
            raise GeminiGenerationError("Gemini API call failed") from exc

        try:
            text = _extract_text(response)
        except GeminiGenerationError:
            raise
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Failed to extract Gemini response text")
            raise GeminiGenerationError("Unexpected Gemini response format") from exc

        if not text.strip():
            raise GeminiGenerationError("Gemini returned an empty response")

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Gemini response was not valid JSON; returning raw text")
            return {"speech": text.strip(), "bullets": []}

    return await asyncio.to_thread(_invoke)


__all__ = [
    "GeminiConfigurationError",
    "GeminiGenerationError",
    "generate_insight",
]
