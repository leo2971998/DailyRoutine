from __future__ import annotations

import importlib
import json
import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

EXPECTED_PHRASES = {
    "task_add": "Added task",
    "task_complete": "Completed task",
    "task_list": "Your top tasks",
    "habit_log": "Logged habit",
    "habit_streak": "habit streak",
    "sched_list": "Today you have",
    "sched_add": "Event added",
    "summary": "daily briefing",
}


def _load_handler():
    try:
        module = importlib.import_module("handler")
    except ModuleNotFoundError as exc:  # pragma: no cover - dependency guard
        if exc.name == "ask_sdk_core":
            raise RuntimeError(
                "ask-sdk-core is required to run the Alexa fixtures. Install it with "
                "'pip install ask-sdk-core' before executing this script."
            ) from exc
        raise
    return module.lambda_handler, module


@contextmanager
def mock_api(responses: Iterable[tuple[str, str, dict | list | str | None]]):
    lambda_handler, module = _load_handler()
    from unittest.mock import patch

    calls = iter(responses)

    def _fake_api(path: str, method: str = "GET", body=None):  # noqa: ANN001
        try:
            expected_path, expected_method, payload = next(calls)
        except StopIteration as exc:  # pragma: no cover - defensive
            raise AssertionError(f"Unexpected API call: {method} {path}") from exc
        assert path == expected_path, f"expected path {expected_path}, got {path}"
        assert (
            method == expected_method
        ), f"expected method {expected_method}, got {method}"
        return payload

    with patch.object(module, "_api", side_effect=_fake_api):
        yield lambda_handler


MOCK_SCENARIOS: dict[str, list[tuple[str, str, dict | list | None]]] = {
    "task_add": [("/v1/tasks", "POST", {"_id": "task1"})],
    "task_complete": [
        (
            "/v1/tasks?user_id=wendy&is_completed=false",
            "GET",
            {
                "items": [
                    {"_id": "task1", "description": "buy milk"},
                    {"_id": "task2", "description": "write report"},
                ]
            },
        ),
        ("/v1/tasks/task1", "PATCH", {"_id": "task1", "is_completed": True}),
    ],
    "task_list": [
        (
            "/v1/tasks?user_id=wendy&is_completed=false",
            "GET",
            {"items": [{"description": "buy milk"}, {"description": "call mom"}]},
        )
    ],
    "habit_log": [("/v1/habit-logs", "POST", {"_id": "log1"})],
    "habit_streak": [
        (
            "/v1/habit-logs?user_id=wendy",
            "GET",
            {"items": [{}, {}, {}]},
        )
    ],
    "sched_list": [
        (
            "/v1/schedule?user_id=wendy",
            "GET",
            {
                "items": [
                    {"summary": "dentist"},
                    {"summary": "team sync"},
                ]
            },
        )
    ],
    "sched_add": [("/v1/schedule", "POST", {"_id": "event1"})],
    "summary": [
        (
            "/v1/summary?user_id=wendy",
            "GET",
            {
                "speech": "Here's your daily briefing. You have 2 tasks and 1 event.",
            },
        )
    ],
}


def _extract_speech(response: dict) -> str:
    output = response.get("response", {}).get("outputSpeech", {})
    if "text" in output:
        return output["text"]
    if "ssml" in output:
        speech = output["ssml"]
        return speech.replace("<speak>", "").replace("</speak>", "")
    return ""


def run_fixture(name: str) -> str:
    fixture_path = FIXTURES_DIR / f"{name}.json"
    if not fixture_path.exists():
        raise FileNotFoundError(f"Unknown fixture {name}")
    event = json.loads(fixture_path.read_text("utf-8"))
    responses = MOCK_SCENARIOS.get(name, [])
    with mock_api(responses) as handler:
        result = handler(event, None)
    speech = _extract_speech(result)
    expected = EXPECTED_PHRASES.get(name)
    if expected and expected.lower() not in speech.lower():
        raise AssertionError(f"Expected phrase '{expected}' in speech '{speech}'")
    return speech


def main(argv: list[str]) -> None:
    if len(argv) > 1:
        name = argv[1].replace(".json", "")
        speech = run_fixture(name)
        print(f"{name}: {speech}")
    else:
        for name in sorted(MOCK_SCENARIOS):
            speech = run_fixture(name)
            print(f"{name}: {speech}")


if __name__ == "__main__":  # pragma: no cover - manual execution
    main(sys.argv)
