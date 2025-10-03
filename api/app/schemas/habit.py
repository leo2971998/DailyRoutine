from datetime import datetime
from typing import Literal, Optional

from pydantic import Field

from .common import MongoModel, PyObjectId

Period = Literal["daily", "weekly"]


class Habit(MongoModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    name: str
    goal_repetitions: int = 1
    goal_period: Period = "daily"
    created_at: datetime
    updated_at: Optional[datetime] = None
    coach_note: Optional[str] = None
    coach_recommended_at: Optional[datetime] = None


class HabitCreate(MongoModel):
    user_id: PyObjectId
    name: str
    goal_repetitions: int = 1
    goal_period: Period = "daily"


class HabitUpdate(MongoModel):
    name: Optional[str] = None
    goal_repetitions: Optional[int] = None
    goal_period: Optional[Period] = None
    coach_note: Optional[str] = None
    coach_recommended_at: Optional[datetime] = None
