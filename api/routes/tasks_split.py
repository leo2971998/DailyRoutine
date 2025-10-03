"""Routes for generating and appending subtasks to existing tasks."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

if __package__:
    from ..app.db import get_db
    from ..app.schemas.task import TaskSubtask
    from ..app.utils.object_ids import resolve_object_id
    from ..app.services.nlp_stub import split_into_steps
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.task import TaskSubtask
    from app.utils.object_ids import resolve_object_id
    from app.services.nlp_stub import split_into_steps

router = APIRouter(prefix="/tasks", tags=["tasks"])


class SubtaskItem(BaseModel):
    description: str = Field(..., min_length=1, max_length=240)
    duration_minutes: Optional[int] = Field(
        None,
        ge=5,
        le=480,
        description="Optional duration hint used by scheduling helpers",
    )
    due_at: Optional[datetime] = Field(
        None,
        description="Optional due date for the subtask",
    )


class SubtaskBulkIn(BaseModel):
    items: List[SubtaskItem] = Field(default_factory=list)


class SubtaskBulkOut(BaseModel):
    inserted: int
    items: List[TaskSubtask]


class SplitIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    max_steps: int = Field(5, ge=1, le=8)


class SplitOut(BaseModel):
    steps: List[str]


@router.post("/{task_id}/subtasks/bulk", response_model=SubtaskBulkOut)
async def create_subtasks_bulk(task_id: str, payload: SubtaskBulkIn) -> SubtaskBulkOut:
    if not payload.items:
        return SubtaskBulkOut(inserted=0, items=[])

    db = get_db()
    tasks = db.tasks

    oid = _parse_object_id(task_id)
    now = datetime.utcnow()

    documents: List[dict] = []
    for item in payload.items:
        summary = item.description.strip()
        if not summary:
            raise HTTPException(status_code=400, detail="Subtask description is required")
        documents.append(
            {
                "_id": ObjectId(),
                "description": summary,
                "duration_minutes": item.duration_minutes,
                "due_at": item.due_at,
                "is_completed": False,
                "created_at": now,
                "updated_at": now,
            }
        )

    result = await tasks.update_one(
        {"_id": oid},
        {
            "$push": {"subtasks": {"$each": documents}},
            "$set": {"updated_at": now},
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    inserted_ids = {doc["_id"] for doc in documents}
    task_doc = await tasks.find_one({"_id": oid}, {"subtasks": 1})
    if task_doc is None:
        raise HTTPException(status_code=404, detail="Task not found")

    subtasks = [
        TaskSubtask.model_validate(doc)
        for doc in task_doc.get("subtasks", [])
        if doc.get("_id") in inserted_ids
    ]

    subtasks.sort(key=lambda item: item.created_at)

    return SubtaskBulkOut(inserted=len(subtasks), items=subtasks)


@router.post("/ai/split", response_model=SplitOut)
async def split_text(body: SplitIn) -> SplitOut:
    steps = split_into_steps(body.text, max_steps=body.max_steps)
    return SplitOut(steps=steps)


def _parse_object_id(value: str) -> ObjectId:
    try:
        return resolve_object_id(value, "task_id")
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail="Invalid task_id") from exc


__all__ = ["router"]
