from datetime import datetime
from pydantic import Field, EmailStr
from .common import MongoModel, PyObjectId


class User(MongoModel):
    id: PyObjectId = Field(alias="_id")
    email: EmailStr
    name: str
    created_at: datetime


class UserCreate(MongoModel):
    email: EmailStr
    name: str


class UserPublic(MongoModel):
    id: PyObjectId = Field(alias="_id")
    email: EmailStr
    name: str
