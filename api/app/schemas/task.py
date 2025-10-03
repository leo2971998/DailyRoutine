from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field

from .common import MongoModel, PyObjectId

Priority = Literal["high", "medium", "low"]


class TaskSubtask(MongoModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    description: str
    duration_minutes: Optional[int] = None
    due_at: Optional[datetime] = None
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime


class Task(MongoModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    description: str
    is_completed: bool = False
    due_date: Optional[datetime] = None
    priority: Priority = "medium"
    created_at: datetime
    updated_at: datetime
    subtasks: List[TaskSubtask] = Field(default_factory=list)


class TaskCreate(MongoModel):
    user_id: PyObjectId
    description: str
    due_date: Optional[datetime] = None
    priority: Priority = "medium"


class TaskUpdate(MongoModel):
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    priority: Optional[Priority] = None
