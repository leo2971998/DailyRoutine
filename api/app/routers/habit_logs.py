from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from ..db import get_db
from ..schemas.habit_log import HabitLog, HabitLogCreate
from ..schemas.common import ListResponse

router = APIRouter(prefix="/v1/habit-logs", tags=["habit_logs"])


@router.post("", response_model=HabitLog, status_code=201)
async def create_habit_log(payload: HabitLogCreate):
    db = get_db()
    doc = payload.model_dump()
    try:
        res = await db.habit_logs.insert_one(doc)
    except Exception as e:
        # likely unique index violation (duplicate log)
        raise HTTPException(status_code=409, detail="Duplicate habit log") from e
    created = await db.habit_logs.find_one({"_id": res.inserted_id})
    return created


@router.get("", response_model=ListResponse)
async def list_habit_logs(
    user_id: str,
    habit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    db = get_db()
    q = {"user_id": ObjectId(user_id)}
    if habit_id:
        q["habit_id"] = ObjectId(habit_id)
    total = await db.habit_logs.count_documents(q)
    items = [h async for h in db.habit_logs.find(q).skip(skip).limit(limit)]
    return {"total": total, "items": items}
