from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from ..db import get_db
from ..schemas.habit import Habit, HabitCreate
from ..schemas.common import ListResponse

router = APIRouter(prefix="/v1/habits", tags=["habits"])


@router.post("", response_model=Habit, status_code=201)
async def create_habit(payload: HabitCreate):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()
    res = await db.habits.insert_one(doc)
    created = await db.habits.find_one({"_id": res.inserted_id})
    return created


@router.get("", response_model=ListResponse)
async def list_habits(user_id: str, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    db = get_db()
    q = {"user_id": ObjectId(user_id)}
    total = await db.habits.count_documents(q)
    items = [h async for h in db.habits.find(q).skip(skip).limit(limit)]
    return {"total": total, "items": items}


@router.get("/{habit_id}", response_model=Habit)
async def get_habit(habit_id: str):
    db = get_db()
    doc = await db.habits.find_one({"_id": ObjectId(habit_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Habit not found")
    return doc


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(habit_id: str):
    db = get_db()
    res = await db.habits.delete_one({"_id": ObjectId(habit_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return None
