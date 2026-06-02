# Form Builder

A containerized full-stack form builder application.

## Project Structure

- `frontend/` - React frontend app
- `backend/` - Node/Express backend app
- `database/` - PostgreSQL initialization and migrations

## Setup

1. Copy `.env.example` to `.env`.
2. Build and start the app with Docker Compose.
   ```bash
   docker compose up --build
   ```

For a fresh database reset, stop the stack and remove volumes:
```bash
docker compose down -v
```

## Phase-based development

This project is built in phases, starting with project scaffolding and moving through Docker, backend, database, authentication, and frontend.
