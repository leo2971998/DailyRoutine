# app/schemas/user.py
from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, field_validator


def _to_str_oid(v: Any) -> str:
    # Accept ObjectId or str; always serialize as string
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


class UserBase(BaseModel):
    email: EmailStr
    name: str


class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def _stringify_oid(cls, v):
        return _to_str_oid(v)

    model_config = dict(populate_by_name=True)


class UserCreate(UserBase):
    pass


class UserPublic(UserBase):
    id: str = Field(alias="_id")

    @field_validator("id", mode="before")
    @classmethod
    def _stringify_oid(cls, v):
        return _to_str_oid(v)

    model_config = dict(populate_by_name=True)
