# Deployment Checklist and Production Changes

This document lists required changes, configuration, and recommended steps to prepare the Form Builder app for deployment to a production environment.

1) Environment & Secrets

- Provide secure secrets — do NOT use defaults in `.env`.
  - `JWT_SECRET` must be a strong, randomly generated secret.
  - `DATABASE_URL` should reference the production DB with secure credentials.
- Use Docker secrets or an orchestration platform secrets manager when possible (Docker Swarm, Kubernetes, AWS Secrets Manager).

2) Build-time frontend API URL

- Ensure the frontend build points to the correct API base path. By default the project builds with `VITE_API_URL=/api` (so Nginx proxies to `/api`). When building for production, explicitly pass the API URL:

```bash
# from repo root
docker compose build frontend
# or when building the image directly
docker build --build-arg VITE_API_URL=https://api.example.com -t form-frontend:prod ./frontend
```

3) Backend production settings

- Set `NODE_ENV=production` in the production container environment.
- Ensure `npm ci --omit=dev` is used in the Dockerfile (already set in this repo) so dev deps are not installed.
- Provide `JWT_SECRET` and any other sensitive variables via environment or secrets.
- Configure logging to stdout (the app already uses `morgan('dev')` — consider switching to a less-verbose production format or to a structured logger).

4) Database readiness and migrations

- The backend includes a retry loop for DB readiness, but plan for initial migrations:
  - Add SQL migration files under `database/`.
  - Run migrations on startup or as a separate job prior to starting the app.

Example: run SQL init script inside the `postgres` container on first bootstrap:

```bash
# Example: copy init SQL file into database/docker-entrypoint-initdb.d/ so Postgres runs it on first start
# Or run migrations manually:
docker compose up -d postgres
# then run the SQL against the DB
docker compose exec -T postgres psql -U postgres -d form_builder -f /path/to/init.sql
```

5) Nginx reverse proxy / TLS

- Terminate TLS at a reverse proxy (NGINX, Traefik, cloud load balancer).
- Update `nginx.conf` or external proxy to forward `/api/` to backend on its internal network, and serve frontend static files.
- Obtain TLS certs via Let's Encrypt and automate renewal.

6) CORS and API exposure

- When using a reverse proxy with same origin for frontend/API (`/api`), you can restrict CORS on backend to the proxy origin.
- If exposing API at a separate host, set `CORS` to allow only your frontend origin(s).

7) Hardening and security

- Do not mount local dev volumes into the production containers.
- Run containers with minimal privileges; use non-root processes where feasible.
- Ensure database backups and access controls are in place.
- Rotate secrets regularly.
- Validate and sanitize all inputs at the API layer.

8) Docker Compose production considerations

- Consider a separate `docker-compose.prod.yml` with production-specific overrides (replicas, constraints, secret usage, different volumes).
- Example run:

```bash
# using overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

9) Persistent storage & backups

- Persist `postgres` data to a volume on the host or managed storage.
- Implement regular backups (cron job, scheduled backup container, or managed DB snapshots).

10) Health checks and restart policies

- Configure container healthchecks for `backend` (e.g., `curl http://localhost:4000/api/health`).
- Use `restart: unless-stopped` or better orchestration controller policies.

11) Logging & monitoring

- Aggregate logs (stdout/stderr) using a centralized system (ELK, Loki, Cloud logs).
- Add basic metrics / health endpoints for uptime monitoring.

12) Performance & scaling

- Scale backend replicas behind a load balancer if required.
- Use connection pooling for Postgres and set connection limits appropriately.
- Consider caching expensive queries or aggregated stats.

13) CI/CD

- Add CI steps to build, test, and publish images to a registry (Docker Hub, GitHub Packages, ECR).
- Use ephemeral environments for testing builds.

14) Commands to test production build locally

```bash
# Build and run all services
docker compose up --build -d

# View backend logs
docker compose logs -f backend

# Rebuild frontend with explicit API URL
docker compose build --no-cache --build-arg VITE_API_URL=https://api.example.com frontend
```

15) Post-deploy checklist

- Verify frontend can reach API (open browser, check network tab).
- Verify authentication flows (register/login/me).
- Submit a test public form and confirm response persists.
- Download CSV export for a test form.
- Check database backups are running.

16) Notes specific to this repo

- `frontend/Dockerfile` accepts `VITE_API_URL` as a build arg; pass it during image build to change API target.
- `backend/Dockerfile` uses `npm ci --omit=dev` to avoid dev dependencies.
- `backend/src/server.js` implements a DB retry loop — you can tune `DB_RETRY_MAX` and `DB_RETRY_DELAY_MS` via environment.

If you'd like, I can:

- scaffold a `docker-compose.prod.yml` with common production patterns, or
- add a `docs/` folder and place example screenshots and diagrams there.

---

_This file was generated to capture production deployment tips and actionable commands for the Form Builder project._