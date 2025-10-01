from pymongo import ASCENDING, DESCENDING
from .db import get_db


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index([("email", ASCENDING)], unique=True)

    await db.tasks.create_indexes([
        # lookups by user and status; due_date for queries/sorts
        (await db.tasks.create_index([("user_id", ASCENDING), ("is_completed", ASCENDING), ("due_date", ASCENDING)]))
    ])

    await db.habits.create_index([("user_id", ASCENDING), ("name", ASCENDING)], unique=False)

    # prevent duplicate same-day logs for same habit/user
    await db.habit_logs.create_index(
        [("user_id", ASCENDING), ("habit_id", ASCENDING), ("date", ASCENDING)],
        unique=True
    )

    await db.schedule_events.create_index([("user_id", ASCENDING), ("start_time", ASCENDING)])
