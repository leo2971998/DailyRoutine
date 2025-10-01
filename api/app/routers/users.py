# users.py
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from ..db import get_db

router = APIRouter(prefix="/v1/users", tags=["users"])


class User(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str


@router.post("", response_model=User, status_code=201)
async def create_user(payload: UserCreate):
    db = get_db()
    # unique by email
    existing = db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")
    doc = {
        "name": payload.name,
        "email": payload.email,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = db.users.insert_one(doc)
    saved = db.users.find_one({"_id": res.inserted_id})
    return User.model_validate({**saved, "_id": str(saved["_id"])})


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate({**user, "_id": str(user["_id"])})
