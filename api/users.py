from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

if __package__:
    from .app.db import get_db
    from .app.schemas.user import User, UserCreate
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.schemas.user import User, UserCreate

router = APIRouter(prefix="/v1/users", tags=["users"])


def _parse_object_id(value: str, field: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field}")
    return ObjectId(value)


@router.post("", response_model=User, status_code=201)
async def create_user(payload: UserCreate) -> User:
    db = get_db()
    users = db.users

    existing = await users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    now = datetime.utcnow()
    doc = payload.model_dump(exclude_none=True)
    doc.update({"created_at": now})

    res = await users.insert_one(doc)
    saved = await users.find_one({"_id": res.inserted_id})
    assert saved is not None
    return User.model_validate(saved)


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str) -> User:
    db = get_db()
    users = db.users

    oid = _parse_object_id(user_id, "user_id")
    user = await users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate(user)
