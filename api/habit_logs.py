# habit_logs.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from api.app.db import get_db
from api.app.schemas.habit_log import HabitLog, HabitLogCreate
from api.app.schemas.common import ListResponse

router = APIRouter(prefix="/v1/habit-logs", tags=["habit_logs"])


@router.post("", response_model=HabitLog, status_code=201)
async def create_habit_log(payload: HabitLogCreate):
    db = get_db()
    habit = db.habits.find_one({"_id": ObjectId(payload.habit_id), "user_id": payload.user_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    log_doc = {
        "habit_id": ObjectId(payload.habit_id),
        "user_id": payload.user_id,
        "date": payload.date or datetime.utcnow().date().isoformat(),
        "value": payload.value,
        "note": payload.note or "",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    inserted = db.habit_logs.insert_one(log_doc)
    saved = db.habit_logs.find_one({"_id": inserted.inserted_id})
    return HabitLog.model_validate({**saved, "habit_id": str(saved["habit_id"]), "_id": str(saved["_id"])})


@router.get("", response_model=ListResponse[HabitLog])
async def list_habit_logs(
        user_id: str = Query(..., description="User ID"),
        habit_id: str | None = Query(None, description="Filter by habit"),
        date: str | None = Query(None, description="Filter by date (YYYY-MM-DD)"),
):
    db = get_db()
    query: dict = {"user_id": user_id}
    if habit_id:
        query["habit_id"] = ObjectId(habit_id)
    if date:
        query["date"] = date

    cursor = db.habit_logs.find(query).sort("date", -1)
    items: list[HabitLog] = []
    async for doc in cursor:
        items.append(HabitLog.model_validate({**doc, "_id": str(doc["_id"]), "habit_id": str(doc["habit_id"])}))
    return {"items": items, "total": len(items)}
