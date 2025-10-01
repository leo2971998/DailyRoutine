# tasks.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from ..db import get_db

router = APIRouter(prefix="/v1/tasks", tags=["tasks"])


class Task(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    title: str
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    user_id: str
    title: str


@router.post("", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate):
    db = get_db()
    doc = {
        "user_id": payload.user_id,
        "title": payload.title,
        "is_completed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = db.tasks.insert_one(doc)
    saved = db.tasks.find_one({"_id": res.inserted_id})
    return Task.model_validate({**saved, "_id": str(saved["_id"])})


@router.get("", response_model=List[Task])
async def list_tasks(
        user_id: str = Query(...),
        is_completed: Optional[bool] = Query(None),
):
    db = get_db()
    query = {"user_id": user_id}
    if is_completed is not None:
        query["is_completed"] = is_completed
    cursor = db.tasks.find(query).sort("created_at", -1)
    items: List[Task] = []
    async for doc in cursor:
        items.append(Task.model_validate({**doc, "_id": str(doc["_id"])}))
    return items


@router.patch("/{task_id}", response_model=Task)
async def update_task(task_id: str, is_completed: Optional[bool] = None, title: Optional[str] = None):
    db = get_db()
    update = {"updated_at": datetime.utcnow()}
    if is_completed is not None:
        update["is_completed"] = is_completed
    if title is not None:
        update["title"] = title
    res = db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    saved = db.tasks.find_one({"_id": ObjectId(task_id)})
    return Task.model_validate({**saved, "_id": str(saved["_id"])})


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str):
    db = get_db()
    res = db.tasks.delete_one({"_id": ObjectId(task_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
