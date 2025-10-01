from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import MONGO_URI, DATABASE_NAME

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[DATABASE_NAME]
    return _db


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
