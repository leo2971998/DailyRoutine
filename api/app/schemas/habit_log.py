from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator
from .common import MongoModel, PyObjectId

Status = Literal["completed", "missed"]


class HabitLog(MongoModel):
    id: PyObjectId = Field(alias="_id")
    habit_id: PyObjectId
    user_id: PyObjectId
    date: datetime
    completed_repetitions: int = 1
    status: Status = "completed"

    @field_validator("status", mode="before")
    @classmethod
    def _normalize_status(cls, value: str) -> str:
        if isinstance(value, str):
            normalized = value.strip().lower()
            mapping = {
                "done": "completed",
                "complete": "completed",
                "skipped": "missed",
                "miss": "missed",
            }
            return mapping.get(normalized, normalized)
        return value


class HabitLogCreate(MongoModel):
    habit_id: PyObjectId
    user_id: PyObjectId
    date: datetime
    completed_repetitions: int = 1
    status: Status = "completed"

    _normalize_status = HabitLog._normalize_status
