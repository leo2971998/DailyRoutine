from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import AliasChoices, BaseModel, Field

try:  # Pydantic v2
    from pydantic import ConfigDict
except ImportError:  # pragma: no cover
    ConfigDict = None  # type: ignore

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.schedule_event import (
        ScheduleEvent,
        ScheduleEventCreate,
        ScheduleEventUpdate,
    )
    from .app.utils.broadcast import broadcast_event
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.schedule_event import (
        ScheduleEvent,
        ScheduleEventCreate,
        ScheduleEventUpdate,
    )
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


class ScheduleBlockIn(BaseModel):
    summary: str = Field(..., min_length=1)
    start_time: datetime = Field(
        ..., validation_alias=AliasChoices("start_at", "start_time"), alias="start_time"
    )
    end_time: datetime = Field(
        ..., validation_alias=AliasChoices("end_at", "end_time"), alias="end_time"
    )
    description: Optional[str] = None
    location: Optional[str] = None
    task_id: Optional[str] = None

    if ConfigDict is not None:  # pragma: no branch - guarded import
        model_config = ConfigDict(populate_by_name=True)
    else:  # pragma: no cover - Pydantic v1 fallback
        class Config:
            allow_population_by_field_name = True


class BulkBlocksIn(BaseModel):
    user_id: str
    blocks: List[ScheduleBlockIn]


class BulkBlocksOut(BaseModel):
    inserted: int
    items: List[ScheduleEvent]


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


@router.post("/bulk", response_model=BulkBlocksOut, status_code=201)
async def create_blocks_bulk(payload: BulkBlocksIn) -> BulkBlocksOut:
    db = get_db()
    events = db.schedule_events

    if not payload.blocks:
        return BulkBlocksOut(inserted=0, items=[])

    now = datetime.utcnow()
    user_id = _parse_object_id(payload.user_id, "user_id")

    documents: List[dict] = []
    for block in payload.blocks:
        summary = block.summary.strip()
        if not summary:
            raise HTTPException(status_code=400, detail="Block summary is required")

        start_time = _normalize_datetime(block.start_time)
        end_time = _normalize_datetime(block.end_time)
        if end_time <= start_time:
            raise HTTPException(status_code=400, detail="Block end time must be after start time")

        doc = {
            "user_id": user_id,
            "title": summary,
            "summary": summary,
            "description": block.description,
            "location": block.location,
            "start_time": start_time,
            "end_time": end_time,
            "created_at": now,
            "updated_at": now,
        }
        if block.task_id:
            doc["task_id"] = block.task_id
        documents.append(doc)

    result = await events.insert_many(documents)

    inserted_ids = list(result.inserted_ids)
    cursor = events.find({"_id": {"$in": inserted_ids}})
    saved: List[ScheduleEvent] = []
    async for doc in cursor:
        saved.append(ScheduleEvent.from_mongo(doc))

    saved.sort(key=lambda item: item.start_time)

    for event in saved:
        await broadcast_event("schedule_created", {"event_id": str(event.id)})

    return BulkBlocksOut(inserted=len(saved), items=saved)


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


@router.patch("/{event_id}", response_model=ScheduleEvent)
async def update_event(event_id: str, payload: ScheduleEventUpdate) -> ScheduleEvent:
    db = get_db()
    events = db.schedule_events

    oid = _parse_object_id(event_id, "event_id")
    update_data = payload.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "start_time" in update_data:
        update_data["start_time"] = _normalize_datetime(update_data["start_time"])
    if "end_time" in update_data:
        update_data["end_time"] = _normalize_datetime(update_data["end_time"])

    update_data["updated_at"] = datetime.utcnow()
    res = await events.update_one({"_id": oid}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")

    saved = await events.find_one({"_id": oid})
    if not saved:
        raise HTTPException(status_code=404, detail="Event not found")
    return ScheduleEvent.from_mongo(saved)


__all__ = ["router", "alias_router"]
