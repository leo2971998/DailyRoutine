# habits.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from api.app.db import get_db
from api.app.schemas.habit import Habit, HabitCreate
from api.app.schemas.common import ListResponse

router = APIRouter(prefix="/v1/habits", tags=["habits"])


@router.post("", response_model=Habit, status_code=201)
async def create_habit(payload: HabitCreate):
    db = get_db()
    doc = {
        "user_id": payload.user_id,
        "name": payload.name,
        "schedule": payload.schedule,
        "goal": payload.goal,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = db.habits.insert_one(doc)
    saved = db.habits.find_one({"_id": res.inserted_id})
    return Habit.model_validate({**saved, "_id": str(saved["_id"])})


@router.get("", response_model=ListResponse[Habit])
async def list_habits(user_id: str = Query(...)):
    db = get_db()
    cursor = db.habits.find({"user_id": user_id}).sort("created_at", -1)
    items: list[Habit] = []
    async for doc in cursor:
        items.append(Habit.model_validate({**doc, "_id": str(doc["_id"])}))
    return {"items": items, "total": len(items)}


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(habit_id: str):
    db = get_db()
    res = db.habits.delete_one({"_id": ObjectId(habit_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return None
