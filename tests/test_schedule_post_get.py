from __future__ import annotations

from datetime import datetime

import pytest
from bson import ObjectId

import api.schedule as schedule_module


@pytest.mark.anyio("asyncio")
async def test_create_schedule_item_defaults_and_list(fake_db):
    user_id = ObjectId()

    payload = schedule_module.CreateScheduleRequest(
        user_id=str(user_id),
        summary="Dentist appointment",
        location="Downtown Clinic",
    )

    event = await schedule_module.create_schedule_item(payload)
    assert event.summary == "Dentist appointment"
    assert event.location == "Downtown Clinic"
    assert event.start_time.hour == 9

    listing = await schedule_module.list_schedule(user_id=str(user_id))
    assert listing.total == 1
    assert listing.items[0].summary == "Dentist appointment"
