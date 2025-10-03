"""Simple heuristics to adjust habits based on feedback signals."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict


def propose_adjustment(habit: Dict[str, Any], signal: str) -> Dict[str, Any]:
    """Return a patch payload for ``habit`` based on ``signal``.

    The logic intentionally stays deterministic so it can run without an AI
    provider. Signals map to light-touch adjustments that keep habits
    sustainable while nudging momentum in the right direction.
    """

    normalized = (signal or "").lower()
    current_reps = int(habit.get("goal_repetitions") or 1)
    current_period = habit.get("goal_period", "daily")

    patch: Dict[str, Any] = {}
    coach_note = ""

    if normalized == "too_easy":
        patch["goal_repetitions"] = min(current_reps + 1, 10)
        coach_note = "Stepping up the cadence to keep things exciting."
    elif normalized == "too_hard":
        if current_reps > 1:
            patch["goal_repetitions"] = max(1, current_reps - 1)
            coach_note = "Dialing back the repetitions to make the habit sustainable."
        else:
            patch["goal_period"] = "weekly" if current_period == "daily" else current_period
            coach_note = "Switching to a weekly rhythm for extra breathing room."
    else:  # includes "just_right" and unknowns
        coach_note = "Cadence looks solid—focus on consistency."

    patch["coach_note"] = coach_note
    patch["coach_recommended_at"] = datetime.utcnow()
    return patch


__all__ = ["propose_adjustment"]
