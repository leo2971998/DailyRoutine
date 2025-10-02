from __future__ import annotations

from typing import Iterator

import pytest

from tests.fakes import FakeDB

import api.schedule as schedule_module
import api.summary as summary_module
import api.tasks as tasks_module


@pytest.fixture
def fake_db(monkeypatch: pytest.MonkeyPatch) -> Iterator[FakeDB]:
    db = FakeDB()
    for module in (tasks_module, schedule_module, summary_module):
        monkeypatch.setattr(module, "get_db", lambda db=db: db)
    yield db


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
