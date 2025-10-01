from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from ..db import get_db
from ..schemas.user import User, UserCreate, UserPublic
from ..schemas.common import ListResponse

router = APIRouter(prefix="/v1/users", tags=["users"])


@router.post("", response_model=UserPublic, status_code=201)
async def create_user(payload: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=409, detail="Email already exists")
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()
    res = await db.users.insert_one(doc)
    created = await db.users.find_one({"_id": res.inserted_id})
    return created


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc


@router.get("", response_model=ListResponse)
async def list_users(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    db = get_db()
    total = await db.users.count_documents({})
    items = [u async for u in db.users.find().skip(skip).limit(limit)]
    return {"total": total, "items": items}
