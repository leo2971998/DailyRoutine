from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from ..db import get_db
from ..schemas.task import Task, TaskCreate, TaskUpdate
from ..schemas.common import ListResponse

router = APIRouter(prefix="/v1/tasks", tags=["tasks"])


@router.post("", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()
    res = await db.tasks.insert_one(doc)
    created = await db.tasks.find_one({"_id": res.inserted_id})
    return created


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str):
    db = get_db()
    doc = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


@router.get("", response_model=ListResponse)
async def list_tasks(
    user_id: Optional[str] = None,
    is_completed: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    db = get_db()
    q: dict = {}
    if user_id:
        q["user_id"] = ObjectId(user_id)
    if is_completed is not None:
        q["is_completed"] = is_completed
    total = await db.tasks.count_documents(q)
    items = [t async for t in db.tasks.find(q).skip(skip).limit(limit)]
    return {"total": total, "items": items}


@router.patch("/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        doc = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Task not found")
        return doc
    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": updates})
    doc = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str):
    db = get_db()
    res = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
