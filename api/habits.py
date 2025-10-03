from __future__ import annotations

from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.habit import Habit, HabitCreate, HabitUpdate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.habit import Habit, HabitCreate, HabitUpdate

if __package__:
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover
    from app.utils.object_ids import resolve_object_id


router = APIRouter(prefix="/habits", tags=["habits"])


def _parse_object_id(value: str, field: str) -> ObjectId:
    try:
        return resolve_object_id(value, field)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


@router.post("", response_model=Habit, status_code=201)
async def create_habit(payload: HabitCreate) -> Habit:
    db = get_db()
    habits = db.habits

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    doc.update({"created_at": now, "updated_at": now})

    res = await habits.insert_one(doc)
    saved = await habits.find_one({"_id": res.inserted_id})
    assert saved is not None
    return Habit.model_validate(saved)


@router.get("", response_model=ListResponse[Habit])
async def list_habits(user_id: str = Query(..., description="User ID")) -> ListResponse[Habit]:
    db = get_db()
    habits = db.habits

    query = {"user_id": _parse_object_id(user_id, "user_id")}
    cursor = habits.find(query).sort("created_at", -1)

    items: list[Habit] = []
    async for doc in cursor:
        items.append(Habit.model_validate(doc))
    return ListResponse[Habit](items=items, total=len(items))


@router.patch("/{habit_id}", response_model=Habit)
async def update_habit(habit_id: str, payload: HabitUpdate) -> Habit:
    db = get_db()
    habits = db.habits

    oid = _parse_object_id(habit_id, "habit_id")
    update_data = payload.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow()
    res = await habits.update_one({"_id": oid}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")

    saved = await habits.find_one({"_id": oid})
    if not saved:
        raise HTTPException(status_code=404, detail="Habit not found")
    return Habit.model_validate(saved)


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(habit_id: str) -> None:
    db = get_db()
    habits = db.habits

    oid = _parse_object_id(habit_id, "habit_id")
    res = await habits.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
