from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.habit_log import HabitLog, HabitLogCreate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.habit_log import HabitLog, HabitLogCreate

router = APIRouter(prefix="/v1/habit-logs", tags=["habit_logs"])


def _parse_object_id(value: str, field: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field}")
    return ObjectId(value)


@router.post("", response_model=HabitLog, status_code=201)
async def create_habit_log(payload: HabitLogCreate) -> HabitLog:
    db = get_db()
    habits = db.habits
    logs = db.habit_logs

    habit = await habits.find_one({"_id": payload.habit_id, "user_id": payload.user_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    doc.setdefault("date", now)
    doc.update({"created_at": now, "updated_at": now})

    res = await logs.insert_one(doc)
    saved = await logs.find_one({"_id": res.inserted_id})
    assert saved is not None
    return HabitLog.model_validate(saved)


@router.get("", response_model=ListResponse[HabitLog])
async def list_habit_logs(
    user_id: str = Query(..., description="User ID"),
    habit_id: Optional[str] = Query(None, description="Filter by habit"),
    date: Optional[str] = Query(None, description="Filter by ISO date"),
) -> ListResponse[HabitLog]:
    db = get_db()
    logs = db.habit_logs

    query: dict[str, object] = {"user_id": _parse_object_id(user_id, "user_id")}
    if habit_id:
        query["habit_id"] = _parse_object_id(habit_id, "habit_id")
    if date:
        try:
            query["date"] = datetime.fromisoformat(date)
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise HTTPException(status_code=400, detail="Invalid date format") from exc

    cursor = logs.find(query).sort("date", -1)
    items: list[HabitLog] = []
    async for doc in cursor:
        items.append(HabitLog.model_validate(doc))
    return ListResponse[HabitLog](items=items, total=len(items))
