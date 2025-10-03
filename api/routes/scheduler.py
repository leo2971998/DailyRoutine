from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import List, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:  # Pydantic v2
    from pydantic import ConfigDict
except ImportError:  # pragma: no cover
    ConfigDict = None  # type: ignore

if __package__:
    from ..app.db import get_db
    from ..app.services.freebusy import get_free_intervals
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.services.freebusy import get_free_intervals

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


class PlanTask(BaseModel):
    id: str = Field(alias="_id", description="Task identifier")
    duration_minutes: int = Field(..., gt=0, description="Requested duration in minutes")

    if ConfigDict is not None:  # pragma: no branch - guarded import
        model_config = ConfigDict(populate_by_name=True)
    else:  # pragma: no cover - Pydantic v1 fallback
        class Config:
            allow_population_by_field_name = True


class PlanWindow(BaseModel):
    start: datetime
    end: datetime


class PlanIn(BaseModel):
    user_id: str = Field(..., description="User identifier or alias")
    tasks: List[PlanTask] = Field(default_factory=list)
    window: PlanWindow
    strategy: Literal["first_fit"] = "first_fit"
    block_minutes: int = Field(30, gt=0, le=240, description="Granularity used for scheduling suggestions")


class PlanBlock(BaseModel):
    task_id: str
    start_time: datetime
    end_time: datetime


class PlanOut(BaseModel):
    blocks: List[PlanBlock] = Field(default_factory=list)
    overflow: List[str] = Field(default_factory=list)


@router.post("/plan", response_model=PlanOut)
async def scheduler_plan(payload: PlanIn) -> PlanOut:
    """Propose schedule blocks for the supplied tasks using a greedy first-fit algorithm."""

    if payload.window.start >= payload.window.end:
        raise HTTPException(status_code=400, detail="Invalid planning window")

    if not payload.tasks:
        return PlanOut()

    db = get_db()

    free_intervals = await get_free_intervals(
        db,
        payload.user_id,
        payload.window.start,
        payload.window.end,
        block_minutes=payload.block_minutes,
    )

    if not free_intervals:
        return PlanOut(blocks=[], overflow=[task.id for task in payload.tasks])

    # Copy so we can mutate as we consume availability.
    intervals = [interval.copy() for interval in free_intervals]
    blocks: List[PlanBlock] = []
    overflow: List[str] = []

    block_seconds = payload.block_minutes * 60

    for task in payload.tasks:
        required_slots = math.ceil((task.duration_minutes * 60) / block_seconds)
        required_seconds = max(block_seconds, required_slots * block_seconds)
        required_duration = timedelta(seconds=required_seconds)

        assigned = False
        for interval in intervals:
            available = interval["end"] - interval["start"]
            if available >= required_duration:
                start_at = interval["start"]
                end_at = start_at + required_duration
                blocks.append(PlanBlock(task_id=task.id, start_time=start_at, end_time=end_at))
                interval["start"] = end_at
                assigned = True
                break
        if not assigned:
            overflow.append(task.id)

    return PlanOut(blocks=blocks, overflow=overflow)
