from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.task import Task, TaskCreate, TaskUpdate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.task import Task, TaskCreate, TaskUpdate

if __package__:
    from .app.utils.broadcast import broadcast_event
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover
    from app.utils.broadcast import broadcast_event
    from app.utils.object_ids import resolve_object_id


router = APIRouter(prefix="/tasks", tags=["tasks"])


class CompleteByNameRequest(BaseModel):
    user_id: str = Field(..., description="User identifier or alias")
    name: str = Field(..., min_length=1, description="Task description fragment")




def _parse_object_id(value: str, field: str) -> ObjectId:
    try:
        return resolve_object_id(value, field)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


@router.post("", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate) -> Task:
    db = get_db()
    tasks = db.tasks

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    doc.update({
        "is_completed": False,
        "created_at": now,
        "updated_at": now,
    })
    doc.setdefault("subtasks", [])

    res = await tasks.insert_one(doc)
    saved = await tasks.find_one({"_id": res.inserted_id})
    assert saved is not None
    await broadcast_event("task_created", {"task_id": str(res.inserted_id)})
    return Task.model_validate(saved)


@router.get("", response_model=ListResponse[Task])
async def list_tasks(
    user_id: str = Query(..., description="User ID"),
    is_completed: Optional[bool] = Query(None, description="Filter by completion status"),
) -> ListResponse[Task]:
    db = get_db()
    query: dict[str, object] = {"user_id": _parse_object_id(user_id, "user_id")}
    if is_completed is not None:
        query["is_completed"] = is_completed

    cursor = db.tasks.find(query).sort("created_at", -1)
    items: list[Task] = []
    async for doc in cursor:
        items.append(Task.model_validate(doc))
    return ListResponse[Task](items=items, total=len(items))


@router.patch("/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate) -> Task:
    db = get_db()
    tasks = db.tasks

    oid = _parse_object_id(task_id, "task_id")
    update_data = payload.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.utcnow()

    res = await tasks.update_one({"_id": oid}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    saved = await tasks.find_one({"_id": oid})
    assert saved is not None
    await broadcast_event("task_updated", {"task_id": str(oid)})
    return Task.model_validate(saved)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str) -> None:
    db = get_db()
    tasks = db.tasks

    oid = _parse_object_id(task_id, "task_id")
    res = await tasks.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")


@router.patch("/complete-by-name", response_model=Task)
async def complete_by_name(payload: CompleteByNameRequest) -> Task:
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Task name is required")

    db = get_db()
    tasks = db.tasks

    user_oid = _parse_object_id(payload.user_id, "user_id")
    search = payload.name.strip().lower()

    cursor = tasks.find({"user_id": user_oid, "is_completed": False}).sort("created_at", -1)
    match_id: ObjectId | None = None
    async for doc in cursor:
        description = (doc.get("description") or "").lower()
        if description.startswith(search) or search in description:
            match_id = doc["_id"]
            break

    if match_id is None:
        raise HTTPException(status_code=404, detail="Task not found")

    now = datetime.utcnow()
    await tasks.update_one({"_id": match_id}, {"$set": {"is_completed": True, "updated_at": now}})
    saved = await tasks.find_one({"_id": match_id})
    assert saved is not None
    await broadcast_event("task_completed", {"task_id": str(match_id)})
    return Task.model_validate(saved)


