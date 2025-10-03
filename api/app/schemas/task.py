from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field, field_validator

from .common import MongoModel, PyObjectId

Priority = Literal["high", "medium", "low"]


class TaskSubtask(MongoModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    description: str
    duration_minutes: Optional[int] = None
    due_at: Optional[datetime] = None
    is_completed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_validator('duration_minutes', mode='before')
    @classmethod
    def fix_duration_field_name(cls, v, info):
        # Handle legacy field name 'duration_min' from database
        if 'duration_min' in info.data:
            return info.data['duration_min']
        return v


class Task(MongoModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    description: str
    is_completed: bool = False
    due_date: Optional[datetime] = None
    priority: Priority = "medium"
    created_at: datetime
    updated_at: Optional[datetime] = None
    subtasks: List[TaskSubtask] = Field(default_factory=list)
    
    @field_validator('priority', mode='before')
    @classmethod
    def convert_priority_int_to_str(cls, v):
        """Convert integer priority values to string literals."""
        if isinstance(v, int):
            priority_map = {0: "low", 1: "medium", 2: "high"}
            return priority_map.get(v, "medium")
        return v


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
