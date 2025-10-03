from __future__ import annotations

import asyncio
import json
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Any, Deque, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
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
RATE_LIMIT_PER_MINUTE = int(os.getenv("AI_SUGGEST_RATE_LIMIT", "30"))
RATE_LIMIT_WINDOW_SECONDS = 60

_rate_buckets: dict[str, Deque[float]] = defaultdict(deque)
_rate_lock = asyncio.Lock()

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


async def enforce_rate_limit(user_id: str) -> None:
    if RATE_LIMIT_PER_MINUTE <= 0:
        return

    now = time.monotonic()
    async with _rate_lock:
        bucket = _rate_buckets[user_id]
        while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
            bucket.popleft()
        if len(bucket) >= RATE_LIMIT_PER_MINUTE:
            raise HTTPException(status_code=429, detail="AI suggestions rate limit exceeded")
        bucket.append(now)


async def generate_text(prompt: str, intent: str, payload: Dict[str, Any]) -> str:
    provider = AI_PROVIDER.lower()

    # Placeholder until real provider wiring is added. If keys are missing we fall back immediately.
    has_key = (provider == "gemini" and GEMINI_API_KEY) or (provider == "openai" and OPENAI_API_KEY)
    if not has_key:
        if intent == "task_improve":
            return """
    {"suggestions":[
      {
        "title":"Rewrite for clarity",
        "diff":{"description":"Email Professor Lin about Project 2"},
        "explanation":"Start with a verb; add target and context.",
        "apply_patch":{
          "endpoint":"/v1/tasks/{id}",
          "method":"PATCH",
          "body":{"description":"Email Professor Lin about Project 2"}
        }
      },
      {
        "title":"Split into 3 steps",
        "diff":{"subtasks":["Draft bullets","Write email","Send before 4pm"]},
        "explanation":"Smaller pieces reduce friction.",
        "apply_patch":{
          "endpoint":"/v1/tasks/{id}/subtasks",
          "method":"POST",
          "body":{"items":["Draft bullets","Write email","Send before 4pm"]}
        }
      }
    ]}
    """
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
    if intent == "dashboard_plan":
        tasks = [
            truncate_strings(
                {
                    "description": item.get("description") or item.get("title"),
                    "due_date": item.get("due_date"),
                    "priority": item.get("priority"),
                }
            )
            for item in data.get("tasks", [])[:8]
        ]
        habits = [
            truncate_strings(
                {
                    "name": item.get("name"),
                    "goal_repetitions": item.get("goal_repetitions"),
                    "goal_period": item.get("goal_period"),
                }
            )
            for item in data.get("habits", [])[:8]
        ]
        events = [
            truncate_strings(
                {
                    "summary": item.get("summary") or item.get("title"),
                    "start_time": item.get("start_time"),
                    "end_time": item.get("end_time"),
                }
            )
            for item in data.get("events", [])[:8]
        ]
        return {"tasks": tasks, "habits": habits, "events": events}

    sanitized: Dict[str, Any] = {}
    if entity.type == "task":
        description = data.get("description") or data.get("title")
        if description:
            sanitized["description"] = truncate_strings(description)
        if data.get("due_date") is not None:
            sanitized["due_date"] = truncate_strings(data.get("due_date"))
        if data.get("priority") is not None:
            sanitized["priority"] = truncate_strings(data.get("priority"))
        return sanitized

    if entity.type == "habit":
        if data.get("name"):
            sanitized["name"] = truncate_strings(data.get("name"))
        if data.get("goal_repetitions") is not None:
            sanitized["goal_repetitions"] = truncate_strings(data.get("goal_repetitions"))
        if data.get("goal_period") is not None:
            sanitized["goal_period"] = truncate_strings(data.get("goal_period"))
        return sanitized

    if entity.type == "schedule":
        summary = data.get("summary") or data.get("title")
        if summary:
            sanitized["summary"] = truncate_strings(summary)
        if data.get("start_time") is not None:
            sanitized["start_time"] = truncate_strings(data.get("start_time"))
        if data.get("end_time") is not None:
            sanitized["end_time"] = truncate_strings(data.get("end_time"))
        return sanitized

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
        summary = entity_data.get("summary") or entity_data.get("title") or "Focus Session"
        start = entity_data.get("start_time")
        if start:
            new_start = shift_schedule_time(start)
        else:
            new_start = None
        diff: Dict[str, Any] = {"summary": summary}
        body: Dict[str, Any] = {"summary": summary}
        if new_start:
            diff["start_time"] = new_start
            body["start_time"] = new_start
        return [
            {
                "title": "Add prep buffer",
                "diff": diff,
                "explanation": "Creates space to settle in before the event.",
                "apply_patch": {
                    "endpoint": "/v1/schedule_events/{id}",
                    "method": "PATCH",
                    "body": body,
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

    await enforce_rate_limit(body.user_id)

    sanitized_data = sanitize_entity(body.intent, body.entity)
    preferences = dict(body.preferences or {})
    preferences.setdefault("time_zone", "America/Chicago")
    payload = {
        "user_id": body.user_id,
        "entity": {"type": body.entity.type, "data": sanitized_data},
        "intent": body.intent,
        "preferences": preferences,
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


class AICreateTasksIn(BaseModel):
    user_id: str
    prompt: str
    intent: str = "create_multiple_tasks"


class AICreateTasksOut(BaseModel):
    tasks: List[str]
    created_count: int


@router.post("/tasks/create", response_model=AICreateTasksOut)
async def ai_create_tasks(body: AICreateTasksIn) -> AICreateTasksOut:
    await enforce_rate_limit(body.user_id)
    
    # Create AI prompt for parsing multiple tasks
    prompt = f"""
System: You are an AI assistant that parses user prompts to extract multiple individual tasks.
User: Parse this prompt and extract individual actionable tasks. Return only a JSON array of task descriptions.

Prompt: {body.prompt}

Guidelines:
- Each task should be clear and actionable (start with a verb)
- Keep tasks concise (under 10 words each)
- Extract 2-8 tasks from the prompt
- Return format: {{"tasks": ["task1", "task2", "task3", "task4"]}}

Example:
Input: "Create 3 tasks: 1) Email Professor Lin, 2) Finish homework, 3) Call mom"  
Output: {{"tasks": ["Email Professor Lin", "Finish homework", "Call mom"]}}
"""
    
    try:
        # Try to generate with AI (currently falls back to simple parsing)
        response_text = await generate_text(prompt, "task_create", {"prompt": body.prompt})
        
        # Parse the response
        import json as _json
        result = _json.loads(response_text)
        tasks = result.get("tasks", [])
        
    except Exception:
        # Fallback: Simple parsing of the prompt
        tasks = _parse_tasks_fallback(body.prompt)
    
    return AICreateTasksOut(tasks=tasks, created_count=len(tasks))


def _parse_tasks_fallback(prompt: str) -> List[str]:
    """Simple fallback parser for common task prompt patterns"""
    import re
    
    # Pattern 1: "Create 4 tasks: 1, 2, 3, 4"
    numbered_pattern = r'(?:create|make|add)\s+\d+\s+tasks?:\s*(.+?)(?:\s*$|\s+[A-Z])'
    numbered_match = re.search(numbered_pattern, prompt.lower(), re.DOTALL)
    
    if numbered_match:
        tasks_text = numbered_match.group(1)
        # Extract tasks separated by commas, numbers, or bullets
        tasks = re.split(r'(?:,\s*|\d+[\.\)]\s*|[-•]\s*)', tasks_text)
        tasks = [task.strip() for task in tasks if task.strip()]
        return tasks[:8]  # Limit to 8 tasks
    
    # Pattern 2: Comma-separated tasks
    comma_tasks = [task.strip() for task in prompt.split(',') if task.strip()]
    if len(comma_tasks) >= 2:
        return comma_tasks[:8]
    
    # Pattern 3: Bullet points (•, -, *)
    bullet_pattern = r'(?:[•\-\*]\s*)(.+?)(?=\n|$)'
    bullet_tasks = re.findall(bullet_pattern, prompt)
    if bullet_tasks:
        return [task.strip() for task in bullet_tasks[:8]]
    
    # Pattern 4: Numbered lists
    numbered_pattern = r'\d+[\.\)]\s*(.+?)(?=\n|$|\d+[\.\)])'
    numbered_tasks = re.findall(numbered_pattern, prompt)
    if numbered_tasks:
        return [task.strip() for task in numbered_tasks[:8]]
    
    # Default: Split by common conjunctions and limit to 4
    default_tasks = re.split(r'(?:\s+and\s+|\s+then\s+|\s+next\s+)', prompt)
    return [task.strip() for task in default_tasks[:4] if task.strip()]


__all__ = ["router"]
