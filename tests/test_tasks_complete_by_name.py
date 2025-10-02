from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from bson import ObjectId
from fastapi import HTTPException

import api.tasks as tasks_module


@pytest.mark.anyio("asyncio")
async def test_complete_by_name_updates_task(fake_db):
    user_id = ObjectId()
    now = datetime.utcnow()
    fake_db.tasks.docs = [
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "description": "buy milk",
            "is_completed": False,
            "created_at": now - timedelta(minutes=5),
            "updated_at": now - timedelta(minutes=5),
        },
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "description": "write report",
            "is_completed": False,
            "created_at": now - timedelta(minutes=1),
            "updated_at": now - timedelta(minutes=1),
        },
    ]

    payload = tasks_module.CompleteByNameRequest(user_id=str(user_id), name="buy")
    result = await tasks_module.complete_by_name(payload)

    assert result.is_completed is True
    assert fake_db.tasks.docs[0]["is_completed"] is True


@pytest.mark.anyio("asyncio")
async def test_complete_by_name_missing_task(fake_db):
    user_id = ObjectId()
    fake_db.tasks.docs = [
        {
            "_id": ObjectId(),
            "user_id": user_id,
            "description": "call mom",
            "is_completed": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ]

    payload = tasks_module.CompleteByNameRequest(user_id=str(user_id), name="buy")
    with pytest.raises(HTTPException) as exc:
        await tasks_module.complete_by_name(payload)
    assert exc.value.status_code == 404
