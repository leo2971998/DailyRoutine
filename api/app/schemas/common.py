from bson import ObjectId
from pydantic_core import core_schema
from pydantic import BaseModel, ConfigDict, Field


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source, _handler):
        # Accept str|ObjectId and validate/convert to ObjectId
        return core_schema.no_info_after_validator_function(
            cls._validate,
            core_schema.union_schema([core_schema.is_instance_schema(ObjectId),
                                      core_schema.str_schema()])
        )

    @classmethod
    def _validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class MongoModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str},
        from_attributes=True,
    )


class ListResponse(MongoModel):
    total: int
    items: list
