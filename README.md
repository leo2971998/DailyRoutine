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

   > The frontend automatically appends `/v1` to the configured API URL, so point
   > `VITE_API_URL` to the root of your FastAPI server.

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

## API Endpoints

### Users
- `POST /v1/users` - Create a new user
- `GET /v1/users/{user_id}` - Get user details

### Tasks
- `GET /v1/tasks` - List tasks (supports filtering by user_id, is_completed)
- `POST /v1/tasks` - Create a new task
- `PATCH /v1/tasks/{task_id}` - Update a task
- `DELETE /v1/tasks/{task_id}` - Delete a task

### Habits
- `GET /v1/habits` - List habits
- `POST /v1/habits` - Create a new habit
- `PATCH /v1/habits/{habit_id}` - Update a habit
- `DELETE /v1/habits/{habit_id}` - Delete a habit

### Habit Logs
- `GET /v1/habit-logs` - List habit logs
- `POST /v1/habit-logs` - Log a habit completion

### Schedule
- `GET /v1/schedule` - Get scheduled items

## Testing
- `python -m compileall api/` ensures the backend modules compile successfully
- Frontend build commands require npm registry access which may be restricted in some environments

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
