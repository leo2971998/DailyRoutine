# Daily Routine — FastAPI Service (Phase 1)

## Run locally

1) Install dependencies
```bash
cd api
python -m venv .venv && source .venv/bin/activate  # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env
```

2) Start MongoDB

Local mongod or:

```bash
docker run -p 27017:27017 --name mongo -d mongo:7
```

3) Launch API

```bash
uvicorn main:app --reload --port 8000
```

4) Smoke test

```bash
curl http://localhost:8000/health/live
```

### Example calls

Create a user:

```bash
curl -X POST http://localhost:8000/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","name":"Alex Doe"}'
```

Create a task:

```bash
curl -X POST http://localhost:8000/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","description":"Finish project report","priority":"high"}'
```

List tasks:

```bash
curl "http://localhost:8000/v1/tasks?user_id=<USER_ID>&is_completed=false"
```

Mark task complete:

```bash
curl -X PATCH http://localhost:8000/v1/tasks/<TASK_ID> \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

---

## Notes

- **Create** the folder/files exactly as shown.  
- **Do not modify** the existing Flask/SocketIO app yet.  
- Verify you can `uvicorn main:app --reload --port 8000` and hit `/health/live`.  
- Insert a test user and a few tasks via the sample `curl` commands.

---

## Deferred for Later Phases
- Real OAuth2 and JWT validation (Phase 3). For now, endpoints accept `user_id` parameters directly.  
- AI endpoints for Gemini (Phase 4).  
- Alexa handlers & account linking (Phase 2 & 3).  
- Merging the Socket.IO realtime layer (Phase 2/5) once this API becomes the source of truth.

