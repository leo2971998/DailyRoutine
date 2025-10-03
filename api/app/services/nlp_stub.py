"""Deterministic text helpers that simulate AI step suggestions."""
from __future__ import annotations

import re
from typing import List


_STEP_SPLIT_RE = re.compile(r"[.?!\n]+")


def split_into_steps(text: str, *, max_steps: int = 5) -> List[str]:
    """Return a list of simple steps derived from ``text``.

    The helper is intentionally lightweight so it can be swapped for a real LLM
    call later. Sentences are split on punctuation and trimmed; if the input
    contains fewer sentences than ``max_steps`` we expand the list with a
    generic follow-up suggestion so the UI always has something to show.
    """

    stripped = (text or "").strip()
    if not stripped:
        return ["Clarify the goal", "List the key actions", "Block 30 minutes to start"][:max_steps]

    candidates = [segment.strip() for segment in _STEP_SPLIT_RE.split(stripped) if segment.strip()]
    if not candidates:
        candidates = [stripped]

    steps: List[str] = []
    for candidate in candidates:
        normalized = candidate
        if len(normalized) > 72:
            normalized = normalized[:69].rstrip() + "…"
        if not normalized.lower().startswith(("plan", "draft", "review", "prepare", "email", "write", "focus")):
            normalized = f"{normalized[0].upper()}{normalized[1:]}"
        steps.append(normalized)
        if len(steps) >= max_steps:
            break

    while len(steps) < max_steps:
        steps.append("Review progress and adjust next step")

    return steps[:max_steps]


__all__ = ["split_into_steps"]
