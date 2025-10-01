from datetime import datetime
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


class ScheduleEventCreate(MongoModel):
    user_id: PyObjectId
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
