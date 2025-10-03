from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

if __package__:
    from ..app.db import get_db
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db

router = APIRouter(prefix="/ai", tags=["ai"])


class Entity(BaseModel):
    type: Literal["task", "habit", "schedule"]
    data: Dict[str, Any]


class AISuggestIn(BaseModel):
    user_id: str
    entity: Entity
    intent: Literal["task_improve", "habit_improve", "schedule_optimize", "dashboard_plan"]
    preferences: Dict[str, Any] = Field(default_factory=dict)


class PatchRef(BaseModel):
    endpoint: str
    method: Literal["PATCH", "POST", "PUT"] = "PATCH"
    body: Dict[str, Any] = Field(default_factory=dict)


class Suggestion(BaseModel):
    title: str
    diff: Dict[str, Any] = Field(default_factory=dict)
    explanation: str = ""
    apply_patch: PatchRef


class AISuggestOut(BaseModel):
    suggestions: List[Suggestion]


AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "800"))

SYSTEM_HINT = (
    "You are an assistant that rewrites tasks to be clear and actionable, "
    "splits work into 2–5 small steps, proposes realistic schedule times in the user’s timezone, "
    "and turns habits into SMART goals. Prefer concise, practical suggestions."
)

PROMPT_TEMPLATES = {
    "task_improve": (
        "System: {system}\n"
        "User: Improve this task for clarity and execution. Return JSON with up to 3 suggestions.\n"
        "User JSON: {payload}\n"
        "Guidelines: Use action verbs, keep titles <= 8 words, propose 2–5 subtasks, "
        "and realistic time windows today or tomorrow. Limit response to {max_tokens} tokens."
    ),
    "habit_improve": (
        "System: {system}\n"
        "User: Convert this habit into a SMART habit and propose reminders. Return JSON.\n"
        "User JSON: {payload}\n"
        "Guidelines: Include measurement, frequency, and a motivational message. Limit response to {max_tokens} tokens."
    ),
    "schedule_optimize": (
        "System: {system}\n"
        "User: Suggest time-block adjustments and prep buffers. Return JSON suggestions.\n"
        "User JSON: {payload}\n"
        "Guidelines: Keep adjustments within the next two days and respect existing commitments. Limit response to {max_tokens} tokens."
    ),
    "dashboard_plan": (
        "System: {system}\n"
        "User: Summarize the next 12 hours into 3 small wins and 1 stretch goal. Provide a short pep talk. Return JSON.\n"
        "User JSON: {payload}\n"
        "Guidelines: Be optimistic yet realistic and keep copy under {max_tokens} tokens."
    ),
}


async def generate_text(prompt: str, intent: str, payload: Dict[str, Any]) -> str:
    provider = AI_PROVIDER.lower()

    # Placeholder until real provider wiring is added. If keys are missing we fall back immediately.
    has_key = (provider == "gemini" and GEMINI_API_KEY) or (provider == "openai" and OPENAI_API_KEY)
    if not has_key:
        return json.dumps({"suggestions": build_fallback(intent, payload)})

    # Pseudocode – replace with real provider clients when credentials are available.
    try:  # pragma: no cover - network paths are not exercised in tests
        if provider == "gemini":
            # from google.generativeai import GenerativeModel
            # model = GenerativeModel("gemini-1.5-flash", api_key=GEMINI_API_KEY)
            # response = await model.generate_content_async(prompt)
            # return response.text
            raise NotImplementedError("Gemini provider not wired")
        if provider == "openai":
            # from openai import AsyncOpenAI
            # client = AsyncOpenAI(api_key=OPENAI_API_KEY)
            # response = await client.chat.completions.create(
            #     model="gpt-4o-mini",
            #     messages=[{"role": "system", "content": SYSTEM_HINT}, {"role": "user", "content": prompt}],
            #     max_tokens=MAX_TOKENS,
            # )
            # return response.choices[0].message.content
            raise NotImplementedError("OpenAI provider not wired")
    except Exception:
        # For local/dev environments we surface a deterministic fallback.
        return json.dumps({"suggestions": build_fallback(intent, payload)})

    return json.dumps({"suggestions": build_fallback(intent, payload)})


def sanitize_entity(intent: str, entity: Entity) -> Dict[str, Any]:
    data = entity.data or {}
    allowed_fields = {
        "task": {"description", "due_date", "priority", "is_completed", "notes", "title"},
        "habit": {"name", "goal_repetitions", "goal_period", "reminders"},
        "schedule": {"title", "start_time", "end_time", "description", "location"},
    }

    if intent == "dashboard_plan":
        tasks = [
            truncate_strings({k: v for k, v in item.items() if k in {"description", "due_date", "priority"}})
            for item in data.get("tasks", [])[:8]
        ]
        habits = [
            truncate_strings({k: v for k, v in item.items() if k in {"name", "goal_repetitions", "goal_period"}})
            for item in data.get("habits", [])[:8]
        ]
        events = [
            truncate_strings({k: v for k, v in item.items() if k in {"title", "start_time", "end_time", "description"}})
            for item in data.get("events", [])[:8]
        ]
        return {"tasks": tasks, "habits": habits, "events": events}

    allowed = allowed_fields.get(entity.type, set())
    sanitized: Dict[str, Any] = {}
    for key in allowed:
        if key in data and data[key] is not None:
            sanitized[key] = truncate_strings(data[key])
    return sanitized


def truncate_strings(value: Any, max_length: int = 240) -> Any:
    if isinstance(value, str):
        return value[:max_length]
    if isinstance(value, list):
        return [truncate_strings(item, max_length) for item in value[:20]]
    if isinstance(value, dict):
        return {k: truncate_strings(v, max_length) for k, v in value.items()}
    return value


def build_fallback(intent: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    entity_data = payload.get("entity", {}).get("data", {})
    entity_type = payload.get("entity", {}).get("type")

    if intent == "task_improve":
        description = entity_data.get("description") or entity_data.get("title") or "this task"
        actionable = make_actionable_title(description)
        due_date = entity_data.get("due_date")
        suggestions = [
            {
                "title": "Clarify task focus",
                "diff": {"description": actionable},
                "explanation": "Keeps the task short and action-oriented.",
                "apply_patch": {
                    "endpoint": "/v1/tasks/{id}",
                    "method": "PATCH",
                    "body": {"description": actionable},
                },
            }
        ]
        if due_date:
            shifted = shift_due_date(due_date)
            if shifted:
                suggestions.append(
                    {
                        "title": "Block time on calendar",
                        "diff": {"due_date": shifted},
                        "explanation": "Schedules the work within the next day for momentum.",
                        "apply_patch": {
                            "endpoint": "/v1/tasks/{id}",
                            "method": "PATCH",
                            "body": {"due_date": shifted},
                        },
                    }
                )
        return suggestions[:3]

    if intent == "habit_improve":
        name = entity_data.get("name") or "habit"
        target = f"{name} for 10 minutes" if len(name.split()) <= 3 else name
        smart_name = make_actionable_title(target)
        reminders = ["Set phone reminder at 8:00 AM", "Check-in after dinner"]
        return [
            {
                "title": "Make it SMART",
                "diff": {
                    "name": smart_name,
                    "goal_repetitions": entity_data.get("goal_repetitions", 1),
                    "goal_period": entity_data.get("goal_period", "daily"),
                    "reminders": reminders,
                },
                "explanation": "Adds clear timing and reminder structure.",
                "apply_patch": {
                    "endpoint": "/v1/habits/{id}",
                    "method": "PATCH",
                    "body": {
                        "name": smart_name,
                        "goal_repetitions": entity_data.get("goal_repetitions", 1),
                        "goal_period": entity_data.get("goal_period", "daily"),
                    },
                },
            }
        ]

    if intent == "schedule_optimize":
        title = entity_data.get("title") or "Focus Session"
        start = entity_data.get("start_time")
        if start:
            new_start = shift_schedule_time(start)
        else:
            new_start = None
        diff: Dict[str, Any] = {"title": title}
        body: Dict[str, Any] = {}
        if new_start:
            diff["start_time"] = new_start
            body["start_time"] = new_start
        return [
            {
                "title": "Add prep buffer",
                "diff": diff,
                "explanation": "Creates space to settle in before the event.",
                "apply_patch": {
                    "endpoint": "/v1/schedule-events/{id}",
                    "method": "PATCH",
                    "body": body or {"title": title},
                },
            }
        ]

    if intent == "dashboard_plan":
        tasks = entity_data.get("tasks") or []
        wins = [
            make_actionable_title(item.get("description") or "Progress a key task")
            for item in tasks[:3]
        ] or ["Tidy your workspace", "Plan tomorrow's highlight", "Send one thoughtful message"]
        stretch = "Take a 30-minute focus block for your biggest priority"
        pep_talk = "You've lined up momentum—keep each win light and celebrate after each one."
        return [
            {
                "title": "AI plan",
                "diff": {
                    "wins": wins,
                    "stretch_goal": stretch,
                    "pep_talk": pep_talk,
                },
                "explanation": "Fallback plan generated locally when AI provider is unavailable.",
                "apply_patch": {
                    "endpoint": "/noop",
                    "method": "PATCH",
                    "body": {},
                },
            }
        ]

    # Default safe suggestion
    return [
        {
            "title": "Rewrite for clarity",
            "diff": {},
            "explanation": "Using fallback suggestion because provider was unreachable.",
            "apply_patch": {"endpoint": "/noop", "method": "PATCH", "body": {}},
        }
    ]


def make_actionable_title(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return "Start the next step"
    verbs = ("plan", "draft", "review", "email", "write", "focus", "complete", "prepare")
    lowered = stripped.lower()
    if not lowered.startswith(verbs):
        return f"Complete {stripped}" if len(stripped.split()) > 0 else "Take action"
    return stripped


def shift_due_date(value: Any) -> Optional[str]:
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    shifted = dt.replace(tzinfo=None) + timedelta(hours=4)
    return shifted.isoformat() + "Z"


def shift_schedule_time(value: Any) -> Optional[str]:
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return (dt - timedelta(minutes=15)).isoformat() + "Z"


@router.post("/suggest", response_model=AISuggestOut)
async def ai_suggest(body: AISuggestIn) -> AISuggestOut:
    import json as _json

    sanitized_data = sanitize_entity(body.intent, body.entity)
    payload = {
        "user_id": body.user_id,
        "entity": {"type": body.entity.type, "data": sanitized_data},
        "intent": body.intent,
        "preferences": body.preferences,
        "now_iso": datetime.utcnow().isoformat() + "Z",
    }
    prompt_template = PROMPT_TEMPLATES[body.intent]
    prompt = prompt_template.format(system=SYSTEM_HINT, payload=_json.dumps(payload), max_tokens=MAX_TOKENS)

    raw = await generate_text(prompt, body.intent, payload)
    try:
        data = _json.loads(raw)
        suggestions_raw = data.get("suggestions", [])
    except Exception:
        suggestions_raw = build_fallback(body.intent, payload)

    suggestions: List[Suggestion] = []
    for item in suggestions_raw[:3]:
        try:
            suggestions.append(Suggestion(**item))
        except Exception:
            continue

    if not suggestions:
        suggestions = [Suggestion(**fallback) for fallback in build_fallback(body.intent, payload)[:1]]

    # Optional analytics for tuning suggestions
    try:
        db = get_db()
        await db.ai_events.insert_one(
            {
                "user_id": body.user_id,
                "intent": body.intent,
                "entity_type": body.entity.type,
                "ts": datetime.utcnow(),
                "prompt_bytes": len(prompt.encode("utf-8")),
                "suggestion_count": len(suggestions),
            }
        )
    except Exception:
        pass

    return AISuggestOut(suggestions=suggestions)


__all__ = ["router"]
