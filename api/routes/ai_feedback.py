"""Dedicated routes for recording AI feedback signals."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

if __package__:
    from ..app.db import get_db
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db

router = APIRouter(prefix="/ai", tags=["ai"])


class FeedbackIn(BaseModel):
    user_id: str = Field(..., description="User identifier or alias")
    entity_type: Literal["task", "habit", "schedule", "habit_log"]
    entity_id: str
    signal: Literal["too_easy", "just_right", "too_hard", "applied", "dismissed"]
    suggestion_title: str | None = None
    intent: str | None = None


class FeedbackOut(BaseModel):
    ok: bool = True


@router.post("/feedback", response_model=FeedbackOut)
async def record_feedback(payload: FeedbackIn) -> FeedbackOut:
    db = get_db()
    await db.ai_feedback.insert_one({**payload.model_dump(), "ts": datetime.utcnow()})
    return FeedbackOut()


__all__ = ["router"]
