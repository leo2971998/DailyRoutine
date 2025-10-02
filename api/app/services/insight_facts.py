from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _start_end_for_day(moment: datetime) -> tuple[datetime, datetime]:
    normalized = _normalize_datetime(moment) or datetime.utcnow()
    start = normalized.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def _start_end_for_month(moment: datetime) -> tuple[datetime, datetime]:
    normalized = _normalize_datetime(moment) or datetime.utcnow()
    start = normalized.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _iso(dt: datetime | None) -> str | None:
    if not isinstance(dt, datetime):
        return None
    value = dt.isoformat()
    if dt.tzinfo is None:
        return value + "Z"
    return value


async def build_daily_facts(
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    reference: datetime,
) -> Dict[str, Any]:
    start, end = _start_end_for_day(reference)
    y_start, y_end = _start_end_for_day(reference - timedelta(days=1))
    now = _normalize_datetime(reference) or datetime.utcnow()

    tasks = db.tasks
    habits = db.habit_logs
    habit_defs = db.habits
    events = db.schedule_events

    open_count = await tasks.count_documents({"user_id": user_id, "is_completed": False})

    open_cursor = (
        tasks.find(
            {"user_id": user_id, "is_completed": False},
            {"description": 1, "priority": 1, "due_date": 1, "created_at": 1},
        )
        .sort([("priority", 1), ("due_date", 1), ("created_at", 1)])
        .limit(5)
    )
    top_open: List[Dict[str, Any]] = []
    async for doc in open_cursor:
        top_open.append(
            {
                "description": doc.get("description"),
                "priority": doc.get("priority"),
                "due_date": _iso(doc.get("due_date")),
            }
        )

    completed_cursor = tasks.find(
        {
            "user_id": user_id,
            "is_completed": True,
            "updated_at": {"$gte": start, "$lt": end},
        },
        {"created_at": 1, "updated_at": 1},
    )
    completed_today_docs = await completed_cursor.to_list(length=250)
    completed_today = len(completed_today_docs)

    durations: List[float] = []
    for doc in completed_today_docs:
        created = doc.get("created_at")
        updated = doc.get("updated_at")
        if isinstance(created, datetime) and isinstance(updated, datetime) and updated >= created:
            durations.append((updated - created).total_seconds() / 3600)
    avg_completion_time_hours = round(sum(durations) / len(durations), 2) if durations else None

    completed_yesterday = await tasks.count_documents(
        {
            "user_id": user_id,
            "is_completed": True,
            "updated_at": {"$gte": y_start, "$lt": y_end},
        }
    )

    created_today = await tasks.count_documents(
        {
            "user_id": user_id,
            "created_at": {"$gte": start, "$lt": end},
        }
    )

    overdue_count = await tasks.count_documents(
        {
            "user_id": user_id,
            "is_completed": False,
            "due_date": {"$lt": start},
        }
    )

    logs_cursor = habits.find(
        {"user_id": user_id, "date": {"$gte": start, "$lt": end}},
        {"habit_id": 1, "status": 1},
    )
    logs_today = await logs_cursor.to_list(length=200)
    habit_ids = {doc.get("habit_id") for doc in logs_today if isinstance(doc.get("habit_id"), ObjectId)}
    habit_map: Dict[ObjectId, str] = {}
    if habit_ids:
        habit_cursor = habit_defs.find({"_id": {"$in": list(habit_ids)}}, {"name": 1})
        async for habit in habit_cursor:
            if isinstance(habit.get("_id"), ObjectId):
                habit_map[habit["_id"]] = habit.get("name", "")

    habit_examples = []
    for doc in logs_today:
        habit_id = doc.get("habit_id")
        name = habit_map.get(habit_id)
        if name and name not in habit_examples:
            habit_examples.append(name)
        if len(habit_examples) >= 5:
            break

    status_counter = Counter(doc.get("status") for doc in logs_today if isinstance(doc.get("status"), str))

    events_today_count = await events.count_documents(
        {"user_id": user_id, "start_time": {"$gte": start, "$lt": end}}
    )

    upcoming_cursor = (
        events.find(
            {"user_id": user_id, "start_time": {"$gte": start, "$lt": end}},
            {"summary": 1, "title": 1, "start_time": 1},
        )
        .sort("start_time", 1)
        .limit(5)
    )
    today_events: List[Dict[str, Any]] = []
    async for doc in upcoming_cursor:
        summary = doc.get("summary") or doc.get("title")
        today_events.append({"summary": summary, "start_time": _iso(doc.get("start_time"))})

    next_event_doc = await events.find_one(
        {"user_id": user_id, "start_time": {"$gte": now}},
        sort=[("start_time", 1)],
        projection={"summary": 1, "title": 1, "start_time": 1},
    )

    next_event: Dict[str, Any] | None = None
    if next_event_doc:
        summary = next_event_doc.get("summary") or next_event_doc.get("title")
        next_event = {"summary": summary, "start_time": _iso(next_event_doc.get("start_time"))}

    return {
        "period": "daily",
        "generated_at": _iso(now),
        "day": start.date().isoformat(),
        "tasks": {
            "open_count": open_count,
            "completed_today": completed_today,
            "completed_yesterday": completed_yesterday,
            "created_today": created_today,
            "overdue_count": overdue_count,
            "avg_completion_time_hours": avg_completion_time_hours,
            "top_open": top_open,
        },
        "habits": {
            "logged_today": len(logs_today),
            "status_breakdown": dict(status_counter),
            "examples": habit_examples,
        },
        "schedule": {
            "events_today": events_today_count,
            "next_event": next_event,
            "today_events": today_events,
        },
    }


async def build_monthly_facts(
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    reference: datetime,
) -> Dict[str, Any]:
    start, end = _start_end_for_month(reference)

    tasks = db.tasks
    habits = db.habit_logs
    habit_defs = db.habits
    events = db.schedule_events

    created_count = await tasks.count_documents(
        {"user_id": user_id, "created_at": {"$gte": start, "$lt": end}}
    )

    completed_cursor = tasks.find(
        {
            "user_id": user_id,
            "is_completed": True,
            "updated_at": {"$gte": start, "$lt": end},
        },
        {"updated_at": 1},
    )
    completed_docs = await completed_cursor.to_list(length=1000)
    completed_count = len(completed_docs)

    weekday_counter = Counter()
    for doc in completed_docs:
        updated = doc.get("updated_at")
        if isinstance(updated, datetime):
            weekday_counter[updated.weekday()] += 1

    open_count = await tasks.count_documents({"user_id": user_id, "is_completed": False})

    habit_logs_cursor = habits.find(
        {"user_id": user_id, "date": {"$gte": start, "$lt": end}},
        {"habit_id": 1, "status": 1},
    )
    habit_log_docs = await habit_logs_cursor.to_list(length=2000)
    habit_ids = {doc.get("habit_id") for doc in habit_log_docs if isinstance(doc.get("habit_id"), ObjectId)}

    habit_map: Dict[ObjectId, str] = {}
    if habit_ids:
        habit_cursor = habit_defs.find({"_id": {"$in": list(habit_ids)}}, {"name": 1})
        async for doc in habit_cursor:
            if isinstance(doc.get("_id"), ObjectId):
                habit_map[doc["_id"]] = doc.get("name", "")

    habit_counter = Counter()
    status_counter = Counter()
    for doc in habit_log_docs:
        habit_id = doc.get("habit_id")
        status = doc.get("status")
        if isinstance(status, str):
            status_counter[status] += 1
        name = habit_map.get(habit_id)
        if name:
            habit_counter[name] += 1

    schedule_cursor = events.find(
        {"user_id": user_id, "start_time": {"$gte": start, "$lt": end}},
        {"start_time": 1},
    )
    schedule_docs = await schedule_cursor.to_list(length=1000)
    schedule_weekdays = Counter()
    schedule_hours = Counter()
    for doc in schedule_docs:
        start_time = doc.get("start_time")
        if isinstance(start_time, datetime):
            schedule_weekdays[start_time.weekday()] += 1
            schedule_hours[start_time.hour] += 1

    return {
        "period": "monthly",
        "month": start.strftime("%Y-%m"),
        "tasks": {
            "created": created_count,
            "completed": completed_count,
            "open": open_count,
            "completions_by_weekday": dict(weekday_counter),
        },
        "habits": {
            "total_logs": len(habit_log_docs),
            "status_breakdown": dict(status_counter),
            "top_habits": habit_counter.most_common(5),
        },
        "schedule": {
            "events": len(schedule_docs),
            "events_by_weekday": dict(schedule_weekdays),
            "events_by_hour": dict(schedule_hours),
        },
    }


__all__ = ["build_daily_facts", "build_monthly_facts"]
