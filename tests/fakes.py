from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, Iterator, List, Optional

from bson import ObjectId


class FakeCursor:
    def __init__(self, docs: Iterable[dict]) -> None:
        self._base_docs = list(docs)
        self._sort_key: Optional[str] = None
        self._sort_direction: int = 1
        self._limit: Optional[int] = None
        self._iter: Optional[Iterator[dict]] = None

    def sort(self, key: str, direction: int) -> "FakeCursor":
        self._sort_key = key
        self._sort_direction = direction
        return self

    def limit(self, value: int) -> "FakeCursor":
        self._limit = value
        return self

    def _prepare(self) -> List[dict]:
        docs = list(self._base_docs)
        if self._sort_key is not None:
            reverse = self._sort_direction < 0
            docs.sort(key=lambda doc: doc.get(self._sort_key), reverse=reverse)
        if self._limit is not None:
            docs = docs[: self._limit]
        return [dict(doc) for doc in docs]

    def __aiter__(self) -> "FakeCursor":
        self._iter = iter(self._prepare())
        return self

    async def __anext__(self) -> dict:
        assert self._iter is not None
        try:
            return next(self._iter)
        except StopIteration as exc:  # pragma: no cover - defensive guard
            raise StopAsyncIteration from exc


@dataclass
class FakeInsertOneResult:
    inserted_id: ObjectId


@dataclass
class FakeUpdateResult:
    matched_count: int
    modified_count: int


@dataclass
class FakeDeleteResult:
    deleted_count: int


class FakeCollection:
    def __init__(self, docs: Optional[List[dict]] = None) -> None:
        self.docs: List[dict] = docs or []

    async def insert_one(self, doc: dict) -> FakeInsertOneResult:
        payload = dict(doc)
        payload.setdefault("_id", ObjectId())
        self.docs.append(payload)
        return FakeInsertOneResult(inserted_id=payload["_id"])

    async def find_one(self, query: Dict[str, Any]) -> Optional[dict]:
        for doc in self.docs:
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Dict[str, Any]) -> FakeCursor:
        filtered = [doc for doc in self.docs if self._matches(doc, query)]
        return FakeCursor(filtered)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> FakeUpdateResult:
        matched = 0
        for doc in self.docs:
            if self._matches(doc, query):
                matched += 1
                for op, changes in update.items():
                    if op == "$set":
                        doc.update(changes)
        return FakeUpdateResult(matched_count=matched, modified_count=matched)

    async def delete_one(self, query: Dict[str, Any]) -> FakeDeleteResult:
        for idx, doc in enumerate(self.docs):
            if self._matches(doc, query):
                del self.docs[idx]
                return FakeDeleteResult(deleted_count=1)
        return FakeDeleteResult(deleted_count=0)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for doc in self.docs if self._matches(doc, query))

    def _matches(self, doc: dict, query: Dict[str, Any]) -> bool:
        for key, expected in query.items():
            value = doc.get(key)
            if isinstance(expected, dict):
                for op, operand in expected.items():
                    if op == "$gte" and not (value >= operand):
                        return False
                    if op == "$gt" and not (value > operand):
                        return False
                    if op == "$lte" and not (value <= operand):
                        return False
                    if op == "$lt" and not (value < operand):
                        return False
            else:
                if value != expected:
                    return False
        return True


class FakeDB:
    def __init__(self) -> None:
        self.tasks = FakeCollection([])
        self.schedule_events = FakeCollection([])
        self.habit_logs = FakeCollection([])


__all__ = ["FakeCollection", "FakeCursor", "FakeDB"]
