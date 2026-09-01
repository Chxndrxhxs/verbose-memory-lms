# Knoova — MasterLMS

A full-stack Learning Management System with separate learner and instructor apps, a shared Django REST API, and MySQL.

## Apps

| App | Path | Domain |
| --- | --- | --- |
| **Learner** | `frontend-learner/` | Browse, enroll, learn, track assignments → `lms.com` |
| **Instructor** | `frontend-instructor/` | Create courses, manage curriculum, view analytics → `teach.lms.com` |
| **Backend** | `backend/` | Single shared Django + DRF API (`/api/v1/`) + MySQL |
| **Shared** | `packages/shared/` | Types, API client, UI utilities (no duplication) |

Roles: `learner` · `instructor` · `admin`.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite`)
- **Backend:** Django 5 + DRF + `djangorestframework-simplejwt` + `django-filter` + `django-environ`
- **DB:** MySQL (with sqlite fallback for local dev)
- **Tooling:** pnpm workspaces (monorepo), `uv` (Python deps), `pytest` + `ruff`

## Repository layout

```
masterlms/
├── AGENTS.md              # source of truth for code style and architecture
├── DESIGN.md              # source of truth for UI design system
├── package.json           # pnpm workspace root
├── pnpm-workspace.yaml
├── frontend-learner/      # student app (Vite + React + TS + Tailwind v4)
├── frontend-instructor/   # teacher app (Vite + React + TS + Tailwind v4)
├── packages/
│   └── shared/            # shared types, api-client, cn()
└── backend/               # Django + DRF + MySQL
    ├── config/            # settings, urls, wsgi
    ├── apps/
    │   ├── users/         # User + OTP + JWT auth
    │   ├── courses/       # Course / Section / Lesson + CRUD
    │   └── enrollments/   # Enrollment + progress
    ├── scripts/seed.py    # 4 sample courses
    ├── pytest.ini
    ├── pyproject.toml     # uv + ruff config
    └── .env.example
```

## Quick start

### 1. Frontend (two apps via pnpm)

```bash
# from repo root
pnpm install
pnpm --filter frontend-learner dev      # http://localhost:5173
pnpm --filter frontend-instructor dev   # http://localhost:5174
```

Other commands:

```bash
pnpm -r build
pnpm -r exec tsc --noEmit
```

### 2. Backend (uv + Django)

```bash
# from repo root
cd backend
uv sync
uv run python manage.py migrate
uv run python scripts/seed.py        # creates 4 sample courses
uv run python manage.py runserver    # http://localhost:8000
```

Other commands (from `backend/`):

```bash
uv add <package>           # add a dep
uv run pytest              # tests
uv run pytest <path> -k <name>
uv run ruff check .        # lint
uv run ruff format .       # format
```

### 3. Configure MySQL (optional)

Copy `backend/.env.example` to `backend/.env` and set:

```env
DATABASE_URL=mysql://root:password@localhost:3306/masterlms
SECRET_KEY=replace-me
DEBUG=True
```

Without `DATABASE_URL`, the backend defaults to local sqlite at `backend/db.sqlite3`.

## API overview

All endpoints live under `/api/v1/`. JWT in `Authorization: Bearer <access>`.

### Auth

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/send-otp` | `{ "mobile": "9876543210" }` | Sends OTP (mock `1234` for dev) |
| `POST` | `/auth/verify-otp` | `{ "mobile": "...", "code": "1234" }` | Returns `{ user, tokens: {access, refresh}, is_new }` |
| `POST` | `/auth/refresh` | `{ "refresh": "..." }` | New access token |
| `PATCH` | `/auth/complete-profile` | `{ name, email, age, avatar }` | Auth required |
| `POST` | `/auth/become-instructor` | — | Promote current user to instructor |
| `GET`  | `/users/me` | — | Current user |

### Courses

| Method | Path | Notes |
| --- | --- | --- |
| `GET`  | `/courses/?category=&search=&ordering=` | List published, paginated (`PAGE_SIZE=12`) |
| `GET`  | `/courses/{id}/` | Detail with sections + lessons |
| `POST` | `/courses/` | Instructor only |
| `PATCH`| `/courses/{id}/` | Owner only |
| `POST` | `/courses/{id}/publish/` | Owner only |
| `GET`  | `/courses/mine/` | Instructor's own courses |

### Enrollments

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/courses/{id}/enroll` | Auth required |
| `GET`  | `/me/courses` | Auth required |
| `POST` | `/courses/{id}/lessons/complete` | `{ lesson_id }` |

Response shape:

```json
{ "data": ..., "error": null, "meta": { "page": 1, "total": 100 } }
```

## Auth flow & Cookies

1. `POST /auth/send-otp` with mobile — backend generates a random 4-digit code (returned in response as `mock_code` and shown in toast for easy testing).
2. `POST /auth/verify-otp` with the code — backend creates a user if new, returns JWT tokens and sets `httpOnly` secure cookies (`access_token`, `refresh_token`).
3. Frontend uses `credentials: "include"` on all API calls; `CookieJWTAuthentication` on the backend reads the cookie automatically.
4. New users are redirected to `/complete-profile` to fill in name, email, age, avatar.

Roles are upgraded via `POST /auth/become-instructor` or directly by an admin.

## Frontend ↔ Backend wiring

- Frontends use `VITE_API_URL` (default `http://localhost:8000/api/v1`) and `TanStack Query` for server state.
- Learner auth keys are namespaced per app: `knoova_learner_user` and `knoova_instructor_user` to avoid cross-app localStorage collisions.
- A `Protected` component redirects unauthenticated users to `/login` (learner) and the equivalent for instructor.

## Code style

- See `AGENTS.md` for enforced rules: container–presenter split, `snake_case` in Python, no `any` in TypeScript, max 100 chars, services layer in `backend/apps/*/services.py`.
- See `DESIGN.md` for the visual system: `bg-[#f6f5f1]` canvas, ink `#0f172a`, primary `#3478ff`, pill nav, `rounded-[28px]` cards, font stack (Inter + Instrument Sans/Serif + Newsreader).

## Testing

- **Backend:** `uv run pytest` — covers OTP + course CRUD + publish flow.
- **Frontend:** Vitest + RTL planned (added deps in `package.json`); E2E scaffolding with Playwright to follow.

## Roadmap

- [x] Cookie-based JWT authentication (`httpOnly` cookies)
- [x] Media uploads endpoint (`POST /api/v1/upload/` for PDFs, videos, audio, images)
- [x] Rich markdown rendering (`@tailwindcss/typography` + `remark-gfm` tables & code blocks)
- [x] Native `react-pdf` reader component for PDF lessons
- [x] Learner profile activity heatmap (`GET /me/activity/`)
- [ ] Real payment gateway integration (Stripe / Razorpay)
- [ ] Playwright E2E test suite expansion

## License

Private project — all rights reserved.
