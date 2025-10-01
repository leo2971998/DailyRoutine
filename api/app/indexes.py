from pymongo import ASCENDING
from .db import get_db

async def ensure_indexes() -> None:
    db = get_db()

    await db.users.create_index([("email", ASCENDING)], unique=True)

    # tasks: query by user, completion, and sort/filter by due_date
    await db.tasks.create_index([("user_id", ASCENDING), ("is_completed", ASCENDING), ("due_date", ASCENDING)])

    # habits: list by user + name
    await db.habits.create_index([("user_id", ASCENDING), ("name", ASCENDING)])

    # habit_logs: prevent duplicate logs per (user, habit, date)
    await db.habit_logs.create_index(
        [("user_id", ASCENDING), ("habit_id", ASCENDING), ("date", ASCENDING)],
        unique=True,
    )

    # schedule_events: list by user + start time
    await db.schedule_events.create_index([("user_id", ASCENDING), ("start_time", ASCENDING)])