# Form Builder

A containerized full-stack form builder application (React + Express + PostgreSQL) intended for learning and demos.

## Project Structure

- `frontend/` - React (Vite) frontend app served by Nginx in production
- `backend/` - Node.js + Express API
- `database/` - PostgreSQL initialization / migrations

## Quick Start

1. Copy environment example:

```powershell
copy .env.example .env
```

2. Build and start the whole stack (recommended):

```bash
docker compose up --build
```

3. Open the app in your browser:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

For a fresh database reset (removes volumes):

```bash
docker compose down -v
```

## Docker Commands

- Build & start (foreground): `docker compose up --build`
- Start in background: `docker compose up -d --build`
- Stop: `docker compose down`
- Remove volumes & stop: `docker compose down -v`
- View logs: `docker compose logs -f` or `docker compose logs -f backend`
- Rebuild a single service: `docker compose build backend`

## Environment

Primary variables (see `.env.example`):

- `PORT` — backend port (default: 4000)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — authentication secret
- `VITE_API_URL` — override API base URL for frontend build (defaults to `/api` in production)

## Development

- Run frontend locally with Vite: from `frontend/` run `npm install` then `npm run dev` (Vite serves on :5173 by default).
- Run backend locally: from `backend/` run `npm install` then `npm run dev` (nodemon).
- The frontend API client will use `import.meta.env.VITE_API_URL` when present, otherwise `/api` in production or `http://localhost:4000/api` in local dev.

## API Overview

Base URL: `/api`

Auth:

- `POST /api/auth/register` — register { name, email, password } → returns JWT
- `POST /api/auth/login` — login { email, password } → returns JWT
- `GET /api/auth/me` — current user (protected)

Forms & management (protected):

- `GET /api/forms` — list user forms
- `POST /api/forms` — create form (title, description, questions)
- `GET /api/forms/:id` — get form with questions/options
- `PUT /api/forms/:id` — update form
- `DELETE /api/forms/:id` — delete form
- `POST /api/forms/:id/duplicate` — duplicate a form
- `GET /api/forms/:id/responses` — view responses (owner only)
- `GET /api/forms/:id/responses/export` — download CSV of responses

Public form endpoints (anonymous):

- `GET /api/public/forms/:publicId` — fetch public form for rendering
- `POST /api/public/forms/:publicId/responses` — submit a response

All API endpoints return JSON and consistent error objects: `{ error: "message" }`.

## Database Schema Summary

Main tables (simplified):

- `users` — `id, name, email, password_hash, created_at`
- `forms` — `id, user_id, public_id, title, description, created_at, updated_at`
- `questions` — `id, form_id, type, label, required, order`
- `options` — `id, question_id, value, label, order` (for dropdown/radio/checkbox)
- `responses` — `id, form_id, submitted_at, metadata` (stores submission record)
- `answers` — `id, response_id, question_id, value`

Relationships:

- `users` 1→N `forms`
- `forms` 1→N `questions`
- `questions` 1→N `options`
- `forms` 1→N `responses`
- `responses` 1→N `answers`

Indexes:

- `forms.user_id`, `forms.public_id`, `questions.form_id`, `responses.form_id`, `answers.response_id`

See `database/` folder for initialization SQL or migration files.

## Screenshots

Add screenshots of key pages if preparing a demo or submission (Dashboard, Form Editor, Public Form, Responses). Store images in `docs/` or include them in your repo when needed.

## Learning Outcomes

This project demonstrates:

- Containerizing a full-stack app with Docker Compose
- Building a REST API with Express and PostgreSQL
- Client-side form builder patterns in React (dynamic fields)
- Authentication with JWT and protected routes
- CSV export and reporting of collected responses
- Basic production hardening (Dockerfiles, `.dockerignore`, DB readiness)

## Troubleshooting

- Backend fails to connect to DB on first start: the backend includes a retry loop — run `docker compose up` again or increase `DB_RETRY_MAX` in the environment.
- Forgot to copy `.env`: run `copy .env.example .env` and restart.
- Reset database: `docker compose down -v` then `docker compose up --build`.
- See backend logs: `docker compose logs -f backend`.
- Common permission or port conflicts: ensure ports 3000 and 4000 are free or change mapped ports in `docker-compose.yml`.
