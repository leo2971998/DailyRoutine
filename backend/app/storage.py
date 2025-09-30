"""Persistence utilities for the dashboard state."""
from __future__ import annotations

import json
from pathlib import Path
from threading import RLock
from typing import Iterable

from .models import DashboardState, Habit, ProgressSnapshot, RoutineTask

_STATE_PATH = Path(__file__).resolve().parent / "data" / "default_state.json"
_LOCK = RLock()


def _ensure_storage() -> None:
    """Create the default storage file if it does not exist."""
    _STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not _STATE_PATH.exists():
        raise FileNotFoundError(
            "The default state file is missing. Expected it at " f"{_STATE_PATH}"
        )


def load_state() -> DashboardState:
    """Read the dashboard state from disk."""
    _ensure_storage()
    with _LOCK:
        with _STATE_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    return DashboardState.parse_obj(data)


def save_state(state: DashboardState) -> None:
    """Persist the dashboard state to disk."""
    _ensure_storage()
    with _LOCK:
        with _STATE_PATH.open("w", encoding="utf-8") as handle:
            json.dump(json.loads(state.json()), handle, indent=2)


def update_task(tasks: Iterable[RoutineTask], task_id: str, completed: bool) -> None:
    """Mutate a task inside a mutable list of tasks."""
    for task in tasks:
        if task.id == task_id:
            task.completed = completed
            return
    raise KeyError(f"Task '{task_id}' was not found")


def update_habit_progress(
    habits: Iterable[Habit], habit_id: str, *, completed_today: int, streak: int | None
) -> None:
    """Mutate a habit's progress while keeping invariants in place."""
    for habit in habits:
        if habit.id == habit_id:
            habit.completed_today = completed_today
            if streak is not None:
                habit.streak = streak
            return
    raise KeyError(f"Habit '{habit_id}' was not found")


def recompute_progress(state: DashboardState) -> ProgressSnapshot:
    """Generate a new progress snapshot based on the checklist and habits."""
    completed_tasks = sum(1 for task in state.checklist if task.completed)
    completed_habits = sum(
        1 for habit in state.habits if habit.completed_today >= habit.goal_per_day
    )
    snapshot = ProgressSnapshot(
        tasks_completed=completed_tasks,
        tasks_total=len(state.checklist),
        habits_completed=completed_habits,
        habits_total=len(state.habits),
    )
    state.progress = snapshot
    return snapshot
