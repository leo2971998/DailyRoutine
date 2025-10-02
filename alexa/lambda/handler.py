import json
import os
import urllib.parse
import urllib.request

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.utils import is_intent_name

API_BASE = os.getenv("API_BASE")
FIXED_USER_ID = os.getenv("FIXED_USER_ID", "wendy")
TIMEOUT_SEC = float(os.getenv("HTTP_TIMEOUT", "6.0"))


def _api(path: str, method: str = "GET", body: dict | None = None):
    if not API_BASE:
        raise RuntimeError("API_BASE environment variable must be set")
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(body).encode("utf-8") if body else None
    with urllib.request.urlopen(req, data=data, timeout=TIMEOUT_SEC) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _slot(hi: HandlerInput, name: str) -> str:
    try:
        return hi.request_envelope.request.intent.slots[name].value or ""
    except Exception:
        return ""


class TaskIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("TaskIntent")(handler_input)

    def handle(self, handler_input):
        spoken = (_slot(handler_input, "freeText") or "").strip()
        lower = spoken.lower()
        if lower.startswith("add "):
            title = spoken[4:].strip() or "Untitled task"
            _api(
                "/v1/tasks",
                "POST",
                {"user_id": FIXED_USER_ID, "description": title, "priority": "normal"},
            )
            speech = f"Added task: {title}."
        elif lower.startswith("complete "):
            name = spoken[9:].strip()
            tasks = _api(f"/v1/tasks?user_id={FIXED_USER_ID}&is_completed=false")
            items = tasks.get("items") if isinstance(tasks, dict) else tasks
            items = items or []
            task_id = None
            for task in items:
                desc = task.get("description", "").lower()
                if desc.startswith(name.lower()):
                    task_id = task.get("_id")
                    break
            if not task_id:
                for task in items:
                    if name.lower() in task.get("description", "").lower():
                        task_id = task.get("_id")
                        break
            if task_id:
                _api(
                    f"/v1/tasks/{urllib.parse.quote(task_id)}",
                    "PATCH",
                    {"is_completed": True},
                )
                speech = f"Completed task: {name}."
            else:
                speech = f"I couldn't find an open task named {name}."
        else:
            tasks = _api(f"/v1/tasks?user_id={FIXED_USER_ID}&is_completed=false")
            items = tasks.get("items") if isinstance(tasks, dict) else tasks
            names = [task.get("description", "untitled") for task in (items or [])][:5]
            speech = (
                "Your top tasks are " + ", ".join(names)
                if names
                else "You have no tasks."
            )
        return (
            handler_input.response_builder.speak(speech).set_should_end_session(True).response
        )


class HabitIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("HabitIntent")(handler_input)

    def handle(self, handler_input):
        spoken = (_slot(handler_input, "freeText") or "").strip()
        if spoken and not spoken.lower().startswith("check"):
            _api(
                "/v1/habit-logs",
                "POST",
                {"user_id": FIXED_USER_ID, "name": spoken},
            )
            speech = f"Logged habit {spoken}."
        else:
            logs = _api(f"/v1/habit-logs?user_id={FIXED_USER_ID}")
            items = logs.get("items") if isinstance(logs, dict) else logs
            count = len(items or [])
            speech = f"Your current habit streak is {count} days."
        return (
            handler_input.response_builder.speak(speech).set_should_end_session(True).response
        )


class ScheduleIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("ScheduleIntent")(handler_input)

    def handle(self, handler_input):
        spoken = (_slot(handler_input, "freeText") or "").strip()
        if spoken.lower().startswith("add "):
            summary = spoken[4:].strip()
            _api(
                "/v1/schedule",
                "POST",
                {"user_id": FIXED_USER_ID, "summary": summary},
            )
            speech = "Event added."
        else:
            events = _api(f"/v1/schedule?user_id={FIXED_USER_ID}")
            items = events.get("items") if isinstance(events, dict) else events
            names = [event.get("summary", "event") for event in (items or [])][:5]
            speech = (
                "Today you have " + ", ".join(names)
                if names
                else "You have nothing on your schedule today."
            )
        return (
            handler_input.response_builder.speak(speech).set_should_end_session(True).response
        )


class SummaryIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("SummaryIntent")(handler_input)

    def handle(self, handler_input):
        try:
            summary = _api(f"/v1/summary?user_id={FIXED_USER_ID}")
            speech = summary.get("speech", "Here's your daily briefing.")
        except Exception:
            tasks = _api(f"/v1/tasks?user_id={FIXED_USER_ID}&is_completed=false")
            events = _api(f"/v1/schedule?user_id={FIXED_USER_ID}")
            task_items = tasks.get("items") if isinstance(tasks, dict) else tasks
            event_items = events.get("items") if isinstance(events, dict) else events
            speech = (
                f"You have {len(task_items or [])} open tasks and "
                f"{len(event_items or [])} events today."
            )
        return (
            handler_input.response_builder.speak(speech).set_should_end_session(True).response
        )


class LaunchHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return handler_input.request_envelope.request.object_type == "LaunchRequest"

    def handle(self, handler_input):
        return (
            handler_input.response_builder.speak(
                "Welcome to Daily Routine. Try saying: daily briefing."
            )
            .ask("What would you like to do?")
            .response
        )


sb = SkillBuilder()
for handler in [
    LaunchHandler(),
    TaskIntentHandler(),
    HabitIntentHandler(),
    ScheduleIntentHandler(),
    SummaryIntentHandler(),
]:
    sb.add_request_handler(handler)

lambda_handler = sb.lambda_handler()
