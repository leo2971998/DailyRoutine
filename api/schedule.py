from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.schedule_event import ScheduleEvent, ScheduleEventCreate
    from .app.utils.broadcast import broadcast_event
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.schedule_event import ScheduleEvent, ScheduleEventCreate
    from app.utils.broadcast import broadcast_event
    from app.utils.object_ids import resolve_object_id


router = APIRouter(prefix="/schedule-events", tags=["schedule"])
alias_router = APIRouter(prefix="/schedule", tags=["schedule"])


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


class CreateScheduleRequest(BaseModel):
    user_id: str = Field(..., description="User identifier or alias")
    summary: str = Field(..., min_length=1, description="Event summary")
    start: Optional[datetime] = Field(
        None, description="ISO8601 start time (defaults to today at 09:00)"
    )
    end: Optional[datetime] = Field(
        None, description="ISO8601 end time (defaults to start + 1 hour)"
    )
    location: Optional[str] = Field(None, description="Event location")


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
    doc.setdefault("summary", doc.get("title"))
    doc.update({"created_at": now, "updated_at": now})

    res = await events.insert_one(doc)
    saved = await events.find_one({"_id": res.inserted_id})
    assert saved is not None
    event = ScheduleEvent.from_mongo(saved)
    await broadcast_event("schedule_created", {"event_id": str(event.id)})
    return event


@alias_router.post("", response_model=ScheduleEvent, status_code=201)
async def create_schedule_item(payload: CreateScheduleRequest) -> ScheduleEvent:
    db = get_db()
    events = db.schedule_events

    now = datetime.utcnow()
    start_time = _normalize_datetime(payload.start) if payload.start else None
    if start_time is None:
        today = now.astimezone(timezone.utc) if now.tzinfo else now
        start_time = today.replace(hour=9, minute=0, second=0, microsecond=0)
    end_time = _normalize_datetime(payload.end) if payload.end else start_time + timedelta(hours=1)

    summary = payload.summary.strip()
    if not summary:
        raise HTTPException(status_code=400, detail="Summary is required")

    doc = {
        "user_id": _parse_object_id(payload.user_id, "user_id"),
        "title": summary,
        "summary": summary,
        "location": payload.location,
        "start_time": start_time,
        "end_time": end_time,
        "created_at": now,
        "updated_at": now,
    }

    res = await events.insert_one(doc)
    saved = await events.find_one({"_id": res.inserted_id})
    assert saved is not None
    event = ScheduleEvent.from_mongo(saved)
    await broadcast_event("schedule_created", {"event_id": str(event.id)})
    return event


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


@alias_router.get("", response_model=ListResponse[ScheduleEvent])
async def list_schedule(
    user_id: str = Query(..., description="User ID"),
) -> ListResponse[ScheduleEvent]:
    db = get_db()
    events = db.schedule_events

    start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    query: dict[str, object] = {
        "user_id": _parse_object_id(user_id, "user_id"),
        "start_time": {"$gte": start_of_day, "$lt": end_of_day},
    }

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


__all__ = ["router", "alias_router"]
