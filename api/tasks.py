from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.schemas.common import ListResponse
    from .app.schemas.task import Task, TaskCreate, TaskUpdate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.common import ListResponse
    from app.schemas.task import Task, TaskCreate, TaskUpdate

if __package__:
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover
    from app.utils.object_ids import resolve_object_id


router = APIRouter(prefix="/tasks", tags=["tasks"])


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

    res = await tasks.insert_one(doc)
    saved = await tasks.find_one({"_id": res.inserted_id})
    assert saved is not None
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
    return Task.model_validate(saved)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str) -> None:
    db = get_db()
    tasks = db.tasks

    oid = _parse_object_id(task_id, "task_id")
    res = await tasks.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
