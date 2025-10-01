from datetime import datetime
from typing import Literal
from pydantic import Field
from .common import MongoModel, PyObjectId

Status = Literal["completed", "missed"]


class HabitLog(MongoModel):
    id: PyObjectId = Field(alias="_id")
    habit_id: PyObjectId
    user_id: PyObjectId
    date: datetime
    completed_repetitions: int = 1
    status: Status = "completed"


class HabitLogCreate(MongoModel):
    habit_id: PyObjectId
    user_id: PyObjectId
    date: datetime
    completed_repetitions: int = 1
    status: Status = "completed"
