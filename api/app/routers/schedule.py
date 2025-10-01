from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from ..db import get_db
from ..schemas.schedule_event import ScheduleEvent, ScheduleEventCreate
from ..schemas.common import ListResponse

router = APIRouter(prefix="/v1/schedule-events", tags=["schedule"])


@router.post("", response_model=ScheduleEvent, status_code=201)
async def create_event(payload: ScheduleEventCreate):
    db = get_db()
    doc = payload.model_dump()
    res = await db.schedule_events.insert_one(doc)
    created = await db.schedule_events.find_one({"_id": res.inserted_id})
    return created


@router.get("", response_model=ListResponse)
async def list_events(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    db = get_db()
    q = {"user_id": ObjectId(user_id)}
    total = await db.schedule_events.count_documents(q)
    items = [e async for e in db.schedule_events.find(q).skip(skip).limit(limit)]
    return {"total": total, "items": items}


@router.get("/{event_id}", response_model=ScheduleEvent)
async def get_event(event_id: str):
    db = get_db()
    doc = await db.schedule_events.find_one({"_id": ObjectId(event_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str):
    db = get_db()
    res = await db.schedule_events.delete_one({"_id": ObjectId(event_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return None
