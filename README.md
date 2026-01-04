# URL Shortener (Next.js + Express + Supabase)

Full-stack URL shortener:
- **Backend**: Node.js + TypeScript + Express + Supabase Admin client
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + Supabase Auth

## Prerequisites

- Node.js 18+ (recommended)
- A Supabase project

## Project Structure

- `backend/` Express API + redirect handler
- `frontend/` Next.js UI

## Setup

### 1) Backend env

Create `backend/.env` (do **not** commit this file):

```dotenv
PORT=3001
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

- Get these from Supabase Dashboard → **Project Settings → API**
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and must never be used in the frontend

A template is available at `backend/.env.example`.

### 2) Frontend env

Create `frontend/.env.local` (do **not** commit this file):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

- Get the **Project URL** and **anon** key from Supabase Dashboard → **Project Settings → API**
- `NEXT_PUBLIC_BACKEND_URL` should point to where your backend is reachable from the browser

A template is available at `frontend/.env.example`.

### 3) Install dependencies

```powershell
cd backend
npm install
cd ..
cd frontend
npm install
```

### 4) Run locally

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

## API Endpoints

Base URL (local): `http://localhost:3001`

### Health

- `GET /health` → `{ "status": "ok" }`

### Create short URL (authenticated)

- `POST /api/shorten`
- Auth: `Authorization: Bearer <supabase_access_token>`
- Body:

```json
{ "originalUrl": "https://example.com" }
```

- Responses:
  - `201` → `{ "url": { ...row } }`
  - `400` → `{ "error": "..." }` (invalid URL, missing field)
  - `401` → `{ "error": "..." }` (missing/invalid token)
  - `403` → `{ "error": "URL limit reached (100)" }`

### List user URLs (authenticated)

- `GET /api/urls`
- Auth: `Authorization: Bearer <supabase_access_token>`
- Response:

```json
{ "urls": [ ... ] }
```

### Redirect + tracking

- `GET /:code`
- Looks up `code` in the `urls` table and redirects (`302`) to `original_url`
- Increments `click_count` (best-effort)

## Data Model Assumptions (Supabase)

The backend currently assumes a table named `urls` with at least:
- `id` (uuid)
- `user_id` (uuid)
- `original_url` (text)
- `short_code` (text)
- `click_count` (int, default 0)
- `created_at` (timestamp, default now)

Recommended:
- Add a UNIQUE constraint on `short_code`

## Design Decisions

- **Supabase Auth is the source of truth**: the frontend authenticates via Supabase; the backend verifies the Bearer token using `supabase.auth.getUser(token)`.
- **Server-side admin client**: the backend uses the **service role** key to read/write `urls`. This keeps DB operations on the server and avoids leaking privileged credentials.
- **Frontend uses anon key only**: the browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` as intended; access is enforced via Supabase RLS policies and/or server-side checks.
- **Quota enforcement**: backend enforces a per-user limit of 100 URLs.
- **Short code generation**: a random 6-character Base62 code is generated. DB uniqueness should be enforced with a unique constraint.
- **Click tracking**: click count is updated best-effort on redirect; if you need strict concurrency correctness, prefer a DB-side atomic increment.

## Security Notes

- Never commit real secrets (`backend/.env`, `frontend/.env.local`).
- If you accidentally exposed a `service_role` key, rotate it in Supabase immediately.
