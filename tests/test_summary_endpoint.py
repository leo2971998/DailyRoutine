from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from bson import ObjectId

import api.summary as summary_module


@pytest.mark.anyio("asyncio")
async def test_summary_returns_counts(fake_db):
    user_id = ObjectId()
    now = datetime.utcnow()

    fake_db.tasks.docs = [
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "description": "Buy milk",
            "is_completed": False,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "description": "Write report",
            "is_completed": False,
            "created_at": now,
            "updated_at": now,
        },
    ]

    fake_db.schedule_events.docs = [
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "title": "Team sync",
            "summary": "Team sync",
            "start_time": now.replace(hour=10, minute=0, second=0, microsecond=0),
            "end_time": now.replace(hour=11, minute=0, second=0, microsecond=0),
        }
    ]

    fake_db.habit_logs.docs = [
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "date": now,
        },
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "date": now - timedelta(hours=1),
        },
    ]

    result = await summary_module.summary(user_id=str(user_id))
    assert result["tasks_count"] == 2
    assert result["events_count"] == 1
    assert result["habits_logged_today"] == 2
    assert "daily" not in result["speech"].lower()
    assert "You have 2 open tasks" in result["speech"]
