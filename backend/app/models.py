"""Pydantic models that define the Daily Routine dashboard schema."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ScheduleEvent(BaseModel):
    """An event that appears in the user's upcoming schedule."""

    id: str = Field(..., description="Stable identifier for the event")
    title: str
    location: str
    start_time: datetime
    end_time: datetime
    cover_image: Optional[str] = Field(
        None, description="Relative path to an illustrative image"
    )
    color_scheme: str = Field(
        "teal",
        description="Color accent that matches the front-end card presentation.",
    )


class RoutineTask(BaseModel):
    """A concrete task that belongs to the daily routine checklist."""

    id: str
    title: str
    scheduled_for: Optional[str] = Field(
        None, description="Time hint displayed next to the task title."
    )
    completed: bool = False
    category: str = Field(
        "focus",
        description="Semantic category used to group tasks visually on the dashboard.",
    )


class Habit(BaseModel):
    """A recurring habit that the user can check off for the day."""

    id: str
    title: str
    goal_per_day: int = Field(1, ge=1)
    completed_today: int = Field(0, ge=0)
    streak: int = Field(0, ge=0)
    weekly_progress: List[int] = Field(
        default_factory=lambda: [0] * 7,
        description="History of completions for the last 7 days.",
    )


class ProgressSnapshot(BaseModel):
    """Aggregate numbers rendered in the hero card graphs."""

    tasks_completed: int
    tasks_total: int
    habits_completed: int
    habits_total: int


class DashboardState(BaseModel):
    """Top-level structure served to the client."""

    user: str
    greeting: str
    date: datetime
    checklist: List[RoutineTask]
    habits: List[Habit]
    schedule: List[ScheduleEvent]
    progress: ProgressSnapshot


class TaskUpdate(BaseModel):
    """Payload received when the user toggles a task."""

    completed: bool


class HabitProgressUpdate(BaseModel):
    """Payload received when the user updates a habit."""

    completed_today: int = Field(..., ge=0)
    streak: Optional[int] = Field(None, ge=0)


class DashboardEvent(BaseModel):
    """Message that is pushed to connected websocket clients."""

    type: str = Field(..., description="Event discriminator, e.g. 'task_updated'.")
    payload: dict
