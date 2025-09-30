# Daily Routine Dashboard

An interactive daily routine tracker inspired by the Fitplan dashboard aesthetic. The project includes a FastAPI backend that serves dashboard data and broadcasts real-time updates, and a React + Chakra UI frontend that renders a responsive productivity interface.

## Getting Started

### Backend
1. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Run the API with Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend
1. Install Node dependencies (requires npm access to the public registry):
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. The dashboard will be available at `http://localhost:5173` and communicates with the backend at `http://localhost:8000`.

### Real-time Updates
The frontend opens a WebSocket connection at `ws://localhost:8000/ws/dashboard`. Any task or habit update triggers a broadcast so that all connected devices stay in sync.

## Testing
* `python -m compileall backend/app` ensures the backend modules compile successfully.
* Frontend build commands require npm registry access which may be restricted in some environments.

## Project Structure
```
backend/
  app/
    data/                 # Seed data for the dashboard
    main.py               # FastAPI application with REST + WebSocket endpoints
    models.py             # Pydantic schemas for dashboard entities
    storage.py            # Utility helpers for persisting state
    websocket_manager.py  # Connection manager for WebSocket broadcasts
frontend/
  src/
    components/           # Chakra-based UI components for the dashboard
    api/                  # API clients and TypeScript types
    hooks/                # React Query hook for syncing dashboard data
  index.html              # Entry HTML file with Outfit font preload
  package.json            # Frontend dependencies and scripts
```
