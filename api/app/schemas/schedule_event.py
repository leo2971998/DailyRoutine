from datetime import datetime, timedelta
from typing import Optional

from pydantic import Field
from .common import MongoModel, PyObjectId


class ScheduleEvent(MongoModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None

    @classmethod
    def from_mongo(cls, doc: dict) -> "ScheduleEvent":
        data = dict(doc)
        start = data.get("start_time")
        if not start:
            fallback = (
                data.get("date")
                or data.get("timestamp")
                or data.get("created_at")
                or data.get("updated_at")
            )
            if isinstance(fallback, datetime):
                data["start_time"] = fallback
        end = data.get("end_time")
        if not end and data.get("start_time"):
            data["end_time"] = data["start_time"] + timedelta(hours=1)
        return cls.model_validate(data)


class ScheduleEventCreate(MongoModel):
    user_id: PyObjectId
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
