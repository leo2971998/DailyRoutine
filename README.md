# Daily Routine Dashboard

An interactive daily routine tracker inspired by the Fitplan dashboard aesthetic. The project includes a FastAPI backend that serves dashboard data and broadcasts real-time updates, and a React + Chakra UI frontend that renders a responsive productivity interface.

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local installation or Docker)

### Backend Setup
1. Create a virtual environment and install dependencies:
   ```bash
   cd api
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and other settings
   ```

3. Start MongoDB:
   ```bash
   # Option 1: Local MongoDB
   mongod
   
   # Option 2: Docker
   docker run -p 27017:27017 --name mongo -d mongo:7
   ```

4. Run the API with Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. Verify the API is running:
   ```bash
   curl http://localhost:8000/health/live
   ```

### API Versioning & Demo Aliases
- The FastAPI routers are mounted at both the root (e.g. `/tasks`) and the
  versioned `/v1` prefix so existing clients continue to work during the
  migration.
- Habit log routes now respond to both `/habit-logs` and `/habit_logs` for
  compatibility.
- If you rely on the seeded demo data, map any friendly identifiers to the
  MongoDB ObjectId stored in your database by setting these variables in
  `api/.env`:
  ```bash
  echo "DEMO_USER_ALIAS=wendy" >> api/.env
  echo "DEMO_USER_ID=68dcaa1e450fee4dd3d6b17b" >> api/.env
  # or provide multiple entries: DEMO_USER_ALIASES=wendy:68dc...,alex:...
  ```

### Frontend Setup
1. Install Node dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Create .env file in frontend directory
   echo "VITE_API_URL=http://localhost:8000" > .env
   echo "VITE_DEMO_USER_ID=your-demo-user-id" >> .env
   ```

   > The frontend automatically targets the `/v1` API routes, so you can point
   > `VITE_API_URL` at the root of your FastAPI server (with or without a
   > trailing slash or `/v1`).

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

4. The dashboard will be available at `http://localhost:5173`

### Create Test Data
To populate your dashboard with sample data, create a user and some tasks/habits:

```bash
# Create a user
curl -X POST http://localhost:8000/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","name":"Demo User"}'

# Create a task (replace <USER_ID> with the returned user ID)
curl -X POST http://localhost:8000/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","description":"Complete project setup","priority":"high"}'

# Create a habit
curl -X POST http://localhost:8000/v1/habits \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","name":"Morning Exercise","description":"30 minutes of exercise","goal_period":"daily"}'
```

### Real-time Updates
The frontend opens a WebSocket connection at `ws://localhost:8000/ws/dashboard`. Any task or habit update triggers a broadcast so that all connected devices stay in sync.

### AI Sidekick
- Launch the AI Sidekick modal by clicking the ✨ icon on tasks, habits, or schedule cards. The panel fetches `/v1/ai/suggest` and lets you apply suggestions in one click.
- Configure providers with environment variables in `api/.env`:
  - `AI_PROVIDER` – `gemini` (default) or `openai`
  - `GEMINI_API_KEY` / `OPENAI_API_KEY` – credentials for the selected provider
  - `AI_MAX_TOKENS` and `AI_SUGGEST_RATE_LIMIT` (per minute, defaults to 800 and 30 respectively)
- No keys? The backend ships with a deterministic stub so local development always returns valid suggestions.
- Feedback buttons in the modal POST to `/v1/ai/feedback`; monitor the `ai_feedback` collection to tune future prompts.

### AI & Assistive Features
- **Bulk task capture** – `/v1/tasks/bulk` lets you create multiple tasks in one request, perfect for command bar workflows.
- **Autoschedule planner** – `/v1/scheduler/plan` returns a dry-run schedule using your free time. Pair the response with `/v1/schedule-events/bulk` to commit the plan.
- **Smart splits** – `/v1/tasks/{task_id}/subtasks/bulk` appends generated subtasks to a task so you can break down big items quickly. Use `/v1/tasks/ai/split` for a deterministic text-only splitter when AI keys are unavailable.
- **Backlog healer** – `/v1/tasks/replan` proposes new due dates for overdue work, automatically finding the next free focus block.
- **Habit coach feedback** – `/v1/ai/feedback` stores reinforcement signals when a habit feels too easy or too hard, and `/v1/habits/{id}/coach/apply` tunes cadence in one tap.

## API Endpoints

### Users
- `POST /v1/users` - Create a new user
- `GET /v1/users/{user_id}` - Get user details

### Tasks
- `GET /v1/tasks` - List tasks (supports filtering by user_id, is_completed)
- `POST /v1/tasks` - Create a new task
- `PATCH /v1/tasks/{task_id}` - Update a task
- `PATCH /v1/tasks/complete-by-name` - Mark a task complete by providing a description fragment
- `POST /v1/tasks/ai/split` - Generate deterministic steps to split a task when AI providers are unavailable
- `POST /v1/tasks/{task_id}/subtasks/bulk` - Append multiple subtasks generated by the smart split wizard
- `POST /v1/tasks/replan` - Replan overdue work into the next available focus blocks (dry-run or apply)
- `DELETE /v1/tasks/{task_id}` - Delete a task

### Habits
- `GET /v1/habits` - List habits
- `POST /v1/habits` - Create a new habit
- `PATCH /v1/habits/{habit_id}` - Update a habit
- `POST /v1/habits/{habit_id}/coach/apply` - Apply a coach recommendation after feedback
- `DELETE /v1/habits/{habit_id}` - Delete a habit

### Habit Logs
- `GET /v1/habit-logs` - List habit logs
- `POST /v1/habit-logs` - Log a habit completion

### Schedule
- `GET /v1/schedule` - Get today's scheduled items
- `POST /v1/schedule` - Create a simple scheduled item (summary, optional times/location)
- `GET /v1/schedule-events` - List all schedule events with advanced filtering
- `POST /v1/schedule-events` - Create a detailed schedule event (existing schema)
- `POST /v1/schedule-events/bulk` - Create multiple scheduled blocks in a single request
- `POST /v1/scheduler/plan` - Generate an autoschedule plan within a specified window

### Summary
- `GET /v1/summary` - Return a synthesized daily briefing with counts used by the Alexa skill

## Alexa Skill Integration

The repository ships with an Alexa Custom Skill implementation under `alexa/` to provide
hands-free access to tasks, habits, schedules, and a daily briefing.

1. **Interaction model** – Import `alexa/interaction-model/en-US.json` into the Alexa
   Developer Console (Build → Interaction Model → JSON Editor).
2. **Lambda handler** – Package the contents of `alexa/lambda/` (including the vendored
   `ask-sdk-core` dependency) and deploy to an AWS Lambda function running Python 3.11.
   Set the Lambda environment variables:
   - `API_BASE` – Base URL of your FastAPI deployment (e.g., `https://api.example.com`).
   - `FIXED_USER_ID` – Demo user alias or ObjectId (defaults to `wendy`).
   - `HTTP_TIMEOUT` – Optional HTTP timeout in seconds (defaults to `6.0`).
3. **Local fixtures** – Run `python alexa/lambda/local_test.py` to simulate Alexa requests
   offline. The script loads each fixture in `alexa/lambda/fixtures/`, mocks the HTTP
   calls, and asserts that the spoken response contains an expected phrase.
4. **Skill setup** – In the Alexa Developer Console configure the endpoint to point to the
   Lambda ARN, enable testing for your account, and use phrases such as “daily briefing”
   or “add task buy milk.”

The Lambda handler performs deterministic parsing for the new intents:
- `TaskIntent` – “add task …”, “complete task …”, or fallback to list open tasks.
- `HabitIntent` – “log habit …” to create a log or “check habit streak” to count logs.
- `ScheduleIntent` – “add event …” to POST a schedule item or fallback to list today’s
  events.
- `SummaryIntent` – Fetches `/v1/summary` and speaks the returned `speech` field.

## Testing
- `python -m compileall api/` ensures the backend modules compile successfully
- `pytest` runs the new backend unit tests for the summary, schedule, and task helpers (install `pytest` and `anyio` in your virtualenv if they are not already present)
- `python alexa/lambda/local_test.py` verifies Alexa fixtures without hitting the live API

## Project Structure
```
api/
  main.py               # FastAPI application entry point
  users.py              # User management endpoints
  tasks.py              # Task management endpoints  
  habits.py             # Habit tracking endpoints
  habit_logs.py         # Habit logging endpoints
  schedule.py           # Schedule management endpoints
  health.py             # Health check endpoints
  requirements.txt      # Python dependencies
  .env.example          # Environment variables template
  app/                  # Additional app modules
frontend/
  src/
    components/         # Chakra-based UI components for the dashboard
    hooks/              # React Query hooks for data syncing
    api/                # API clients and TypeScript types
    types/              # TypeScript type definitions
  index.html            # Entry HTML file with Outfit font preload
  package.json          # Frontend dependencies and scripts
```

## Technology Stack
- **Backend**: FastAPI, MongoDB, WebSockets
- **Frontend**: React, TypeScript, Chakra UI, Vite
- **Real-time**: WebSocket connections for live updates
- **State Management**: React Query for server state
