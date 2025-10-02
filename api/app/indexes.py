import logging

from pymongo import ASCENDING
from pymongo.errors import AutoReconnect, ConnectionFailure, PyMongoError, ServerSelectionTimeoutError

from .db import get_db

_logger = logging.getLogger(__name__)

_CONNECTION_ERRORS = (
    AutoReconnect,
    ConnectionFailure,
    ServerSelectionTimeoutError,
)


async def ensure_indexes() -> None:
    db = get_db()

    try:
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

        # insights cache: expire old entries and allow hash lookups
        await db.insights.create_index([("ts", ASCENDING)], expireAfterSeconds=60 * 60 * 24 * 90)
        await db.insights.create_index([("facts_hash", ASCENDING)])
    except _CONNECTION_ERRORS as exc:
        _logger.warning("Skipping MongoDB index creation because the database is unreachable: %s", exc)
    except PyMongoError:
        _logger.exception("Failed to create MongoDB indexes")
        raise
