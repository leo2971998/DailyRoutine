from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.schedule_event import ScheduleEvent, ScheduleEventCreate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.schedule_event import ScheduleEvent, ScheduleEventCreate

if __package__:
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover
    from app.utils.object_ids import resolve_object_id


router = APIRouter(prefix="/schedule-events", tags=["schedule"])


def _parse_object_id(value: str, field: str) -> ObjectId:
    try:
        return resolve_object_id(value, field)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


@router.post("", response_model=ScheduleEvent, status_code=201)
async def create_event(payload: ScheduleEventCreate) -> ScheduleEvent:
    db = get_db()
    events = db.schedule_events

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    start_time = doc.get("start_time") or now
    doc["start_time"] = start_time
    doc["end_time"] = doc.get("end_time") or (start_time + timedelta(hours=1))
    doc.update({"created_at": now, "updated_at": now})

    res = await events.insert_one(doc)
    saved = await events.find_one({"_id": res.inserted_id})
    assert saved is not None
    return ScheduleEvent.from_mongo(saved)


@router.get("", response_model=ListResponse[ScheduleEvent])
async def list_events(
    user_id: str = Query(..., description="User ID"),
    start_after: Optional[datetime] = Query(None, description="Return events starting on/after this time"),
    start_before: Optional[datetime] = Query(None, description="Return events starting on/before this time"),
) -> ListResponse[ScheduleEvent]:
    db = get_db()
    events = db.schedule_events

    query: dict[str, object] = {"user_id": _parse_object_id(user_id, "user_id")}
    if start_after or start_before:
        range_filter: dict[str, datetime] = {}
        if start_after:
            range_filter["$gte"] = start_after
        if start_before:
            range_filter["$lte"] = start_before
        query["start_time"] = range_filter

    cursor = events.find(query).sort("start_time", 1)
    items: list[ScheduleEvent] = []
    async for doc in cursor:
        items.append(ScheduleEvent.from_mongo(doc))
    return ListResponse[ScheduleEvent](items=items, total=len(items))


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str) -> None:
    db = get_db()
    events = db.schedule_events

    oid = _parse_object_id(event_id, "event_id")
    res = await events.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
