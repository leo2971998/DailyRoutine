# schedule.py
from datetime import datetime
from typing import Literal
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from api.app.db import get_db
from ..schemas.schedule import ScheduleEvent, ScheduleEventCreate
from api.app.schemas.common import ListResponse

router = APIRouter(prefix="/v1/schedule-events", tags=["schedule"])


@router.post("", response_model=ScheduleEvent, status_code=201)
async def create_event(payload: ScheduleEventCreate):
    db = get_db()
    doc = {
        "user_id": payload.user_id,
        "title": payload.title,
        "start": payload.start,
        "end": payload.end,
        "type": payload.type,  # e.g., 'calendar' | 'task'
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = db.schedule.insert_one(doc)
    saved = db.schedule.find_one({"_id": res.inserted_id})
    return ScheduleEvent.model_validate({**saved, "_id": str(saved["_id"])})


@router.get("", response_model=ListResponse[ScheduleEvent])
async def list_events(
        user_id: str = Query(...),
        type: Literal["calendar", "task"] | None = Query(None),
):
    db = get_db()
    q: dict = {"user_id": user_id}
    if type:
        q["type"] = type
    cursor = db.schedule.find(q).sort("start", 1)
    items: list[ScheduleEvent] = []
    async for doc in cursor:
        items.append(ScheduleEvent.model_validate({**doc, "_id": str(doc["_id"])}))
    return {"items": items, "total": len(items)}


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str):
    db = get_db()
    res = db.schedule.delete_one({"_id": ObjectId(event_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return None
