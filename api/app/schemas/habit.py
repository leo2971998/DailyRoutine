from datetime import datetime
from typing import Literal
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


class HabitCreate(MongoModel):
    user_id: PyObjectId
    name: str
    goal_repetitions: int = 1
    goal_period: Period = "daily"
