from __future__ import annotations
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.utils.object_ids import resolve_object_id

router = APIRouter(prefix="/summary", tags=["summary"])


def _parse_object_id(value: str, field: str):
    try:
        return resolve_object_id(value, field)
    except ValueError as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


@router.get("")
async def summary(user_id: str = Query(..., description="User ID")) -> dict[str, object]:
    db = get_db()
    user_oid = _parse_object_id(user_id, "user_id")

    tasks_cursor = (
        db.tasks.find({"user_id": user_oid, "is_completed": False}).sort("created_at", 1).limit(5)
    )
    tasks: list[dict] = []
    async for doc in tasks_cursor:
        tasks.append(doc)

    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    events_cursor = (
        db.schedule_events.find(
            {"user_id": user_oid, "start_time": {"$gte": start_of_day, "$lt": end_of_day}}
        )
        .sort("start_time", 1)
        .limit(5)
    )
    events: list[dict] = []
    async for doc in events_cursor:
        events.append(doc)

    logs_count = await db.habit_logs.count_documents(
        {"user_id": user_oid, "date": {"$gte": start_of_day, "$lt": end_of_day}}
    )

    task_count = len(tasks)
    event_count = len(events)

    task_names = [doc.get("description") or "a task" for doc in tasks[:3]]
    event_names = [
        doc.get("summary") or doc.get("title") or doc.get("description") or "an event"
        for doc in events[:3]
    ]

    speech_parts: list[str] = []
    if task_count:
        detail = f", including {', '.join(task_names)}" if task_names else ""
        speech_parts.append(f"You have {task_count} open tasks{detail}")
    else:
        speech_parts.append("You have no open tasks")

    if event_count:
        speech_parts.append("Today's schedule includes " + ", ".join(event_names))
    else:
        speech_parts.append("Your schedule is clear")

    if logs_count:
        speech_parts.append(f"You've logged {logs_count} habits today")
    else:
        speech_parts.append("You have not logged any habits today")

    speech = ". ".join(speech_parts) + "."

    return {
        "speech": speech,
        "tasks_count": task_count,
        "events_count": event_count,
        "habits_logged_today": logs_count,
    }


__all__ = ["router"]
