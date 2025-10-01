from __future__ import annotations
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

# Detect Pydantic v2
try:
    from pydantic import ConfigDict  # v2
    IS_PYDANTIC_V2 = True
except Exception:
    IS_PYDANTIC_V2 = False

# Use the bson from pymongo (install via: pip install pymongo)
from bson import ObjectId

# ---- PyObjectId ----
if IS_PYDANTIC_V2:
    from pydantic_core import core_schema

    class PyObjectId(ObjectId):
        @classmethod
        def __get_pydantic_core_schema__(cls, _source_type, _handler):
            return core_schema.no_info_after_validator_function(
                cls._validate,
                core_schema.union_schema(
                    [core_schema.is_instance_schema(ObjectId), core_schema.str_schema()]
                ),
            )

        @classmethod
        def _validate(cls, v):
            if isinstance(v, ObjectId):
                return v
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(str(v))
else:
    class PyObjectId(ObjectId):
        @classmethod
        def __get_validators__(cls):
            yield cls.validate

        @classmethod
        def validate(cls, v):
            if isinstance(v, ObjectId):
                return v
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(str(v))

# ---- Base Mongo model ----
class MongoModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    if IS_PYDANTIC_V2:
        model_config = ConfigDict(
            populate_by_name=True,
            arbitrary_types_allowed=True,
            json_encoders={ObjectId: str},
        )
    else:
        class Config:
            allow_population_by_field_name = True
            arbitrary_types_allowed = True
            json_encoders = {ObjectId: str}

# ---- Generic responses ----
T = TypeVar("T")

class ListResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: Optional[int] = None
    page_size: Optional[int] = None

class ItemResponse(BaseModel, Generic[T]):
    item: T
