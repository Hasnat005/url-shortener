# URL Shortener (Next.js + Express + Supabase)

Full-stack URL shortener:
- Backend: Node.js + TypeScript + Express + Supabase Admin client
- Frontend: Next.js (App Router) + TypeScript + Tailwind + Supabase Auth

## 1) Setup Instructions

### Prerequisites

- Node.js 18+ (recommended)
- A Supabase project

### Install dependencies

```powershell
cd backend
npm ci
cd ..
cd frontend
npm ci
```

### Environment variables

Backend: create `backend/.env` (do not commit). Use `backend/.env.example` as a template.

```dotenv
PORT=3001
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Comma-separated list of allowed frontend origins.
# If empty, the backend will allow any origin.
CORS_ORIGINS=https://your-frontend.vercel.app
```

- Supabase values come from Supabase Dashboard → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. If it leaks, rotate it immediately.

Frontend: create `frontend/.env.local` (do not commit). Use `frontend/.env.example` as a template.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Run locally

In one terminal:

```powershell
cd backend
npm run dev
```

In another terminal:

```powershell
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 2) Project Structure

- `backend/` Express API + redirect handler
  - `src/index.ts`: server + CORS + route wiring
  - `src/routes/urlRoutes.ts`: authenticated API (`/api/*`)
  - `src/routes/redirectRoutes.ts`: `GET /:code` redirect + click tracking
  - `sql/urls.sql`: starter schema for Supabase
- `frontend/` Next.js UI
  - `src/context/AuthContext.tsx`: Supabase auth + token management
  - `src/components/ShortenForm.tsx`: create short URLs + copy
  - `src/app/dashboard/page.tsx`: list URLs + copy + delete

## 3) API Documentation

Base URL (local): `http://localhost:3001`

### `GET /health`

Response (200):

```json
{ "status": "ok" }
```

### `POST /api/shorten` (authenticated)

Headers:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Body:

```json
{ "originalUrl": "https://example.com" }
```

Success (201):

```json
{
  "url": {
    "id": "<uuid>",
    "user_id": "<uuid>",
    "original_url": "https://example.com",
    "short_code": "a1B2c3",
    "click_count": 0,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:
- 400: missing/invalid URL
- 401: missing/invalid token
- 403: `{ "error": "URL limit reached (100)" }`

Notes:
- Short codes are random Base62, length 6–8 characters.

### `GET /api/urls` (authenticated)

Headers:

```http
Authorization: Bearer <supabase_access_token>
```

Success (200):

```json
{
  "urls": [
    {
      "id": "<uuid>",
      "short_code": "a1B2c3",
      "original_url": "https://example.com",
      "click_count": 12,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### `DELETE /api/urls/:id` (authenticated)

Headers:

```http
Authorization: Bearer <supabase_access_token>
```

Success (200):

```json
{ "deletedId": "<uuid>" }
```

Errors:
- 400: `{ "error": "id is required" }`
- 401: unauthorized
- 404: not found (or not owned by the current user)

### `GET /:code` (redirect + tracking)

- Redirects with 302 to the original URL.
- Increments `click_count` best-effort.

If not found (404):

```json
{ "error": "Not found" }
```

## 4) Design Decisions

- Supabase Auth is the source of truth: frontend signs in via Supabase; backend validates `Authorization: Bearer <token>`.
- Backend uses a server-side Supabase Admin client (service role key) to read/write the `urls` table.
- Quota enforcement is server-side: max 100 URLs per user.
- Short code generation uses random Base62 (6–8 chars) with best-effort collision retries; database uniqueness is still recommended.
- Click tracking on redirect is best-effort; for perfect concurrency, prefer a DB-side atomic increment.
- CORS is configurable via `CORS_ORIGINS` (comma-separated allowlist). If empty, all origins are allowed.

## 5) Known Limitations

- The backend is a long-running Express server; deploying it on platforms that only support serverless functions (e.g., Vercel) requires adaptation.
- Redirect click counting is not a transactional atomic increment.
- If the `urls.short_code` column is not unique in the database, collisions are still possible (even with retries).
