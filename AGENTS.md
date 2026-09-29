# AGENTS.md

## Stack
React + TypeScript + Tailwind CSS v4 (pnpm) | Django REST Framework (uv) | MySQL (sqlite fallback `backend/db.sqlite3`) | pnpm workspaces (3 frontends, 1 backend)

## Apps
- `frontend-learner/` — student app (browse, enroll, learn, assignments, packs) → `lms.com` (`:5173`, served at `/`)
- `frontend-instructor/` — instructor app (create course, upload, analytics, assignments, packs) → `teach.lms.com` (`:5174`, served at `/teach/`)
- `frontend-admin/` — admin app (users, courses, enrollments, payments, assignments, categories, packs) → `:5175` (served at `/admin/`)
- `backend/` — single shared Django API (`/api/v1/`) + MySQL/sqlite | roles: `learner | instructor | admin` | per-app cookies via `X-App`
- `packages/shared/` — shared types, api-client, ui (don't duplicate)

## Commands
**Frontend (per app):** `pnpm --filter frontend-learner dev` | `pnpm --filter frontend-instructor dev` | `pnpm --filter frontend-admin dev` | `pnpm -r build` | `pnpm -r lint` | `pnpm -r exec tsc --noEmit`
**Backend:** `uv sync` | `uv add/remove <pkg>` | `uv run python manage.py runserver` | `uv run python manage.py create_admin --mobile <10-digit>` | `uv run python manage.py makemigrations && uv run python manage.py migrate` | `uv run pytest` / `uv run pytest <path> -k <name>` | `uv run ruff check .` / `uv run ruff format .`

## General Style
- Human-written code > AI slop: clear names, small functions, explicit > clever. No over-abstraction, no clever one-liners.
- No unnecessary comments (only *why*). Code should read like a human wrote it.
- No `any` (use `unknown` + narrowing) | No `var` (use `const`/`let`) | `snake_case` in Python | Max 100 chars/line | No `type: ignore` without code.

## Frontend
**Architecture (Smart-Dumb):** Container-Presenter required. Containers (`*.container.tsx`): data/logic only. Presenters (`*.tsx`): pure UI via props only. Never mix — containers delegate to presenters, presenters never fetch.
**Structure (enforced):** `src/components/` (presenters) | `src/containers/` (smart) | `src/hooks/` | `src/lib/` | `src/types/` | `src/pages/` (thin, composes containers) — keep this structure, one component per file.
**React:** Functional components only, one per file. TanStack Query for server state (no `useEffect`+fetch), `react-hook-form`+`zod` for forms, `react-router-dom` for routing, Zustand only for global client state. `useCallback`/`useMemo` and `React.memo` only when needed. Stable IDs for keys. Wrap routes in error boundaries.
**Styling:** Tailwind CSS v4 only (`@import "tailwindcss"` + `@tailwindcss/vite`). Use `cn()` for conditionals. Follow design tokens via `@theme` in CSS, mobile-first (`sm:`/`md:`...), `dark:` not needed. No CSS modules/styled-components.

## Backend
**Structure:** `backend/config/` | `backend/apps/<domain>/{models,serializers,views,urls,services,tests}/` | `backend/core/` — domains: `users` (OTP + per-app cookies), `courses`, `enrollments`, `assignments`, `packs`, `payments`, `adminpanel` (+ `management/commands/create_admin.py`)
**Rules:** Views thin → logic in `services.py`. DRF ViewSets/APIView + serializers + permission classes. `select_related`/`prefetch_related` (no N+1). `makemigrations` only, never edit applied migrations. `django-environ` for secrets, `logging.getLogger` (no `print`).
**API:** `/api/v1/<resource>/` | `{ data, error, meta: { page, total } }` | `PageNumberPagination` + `django-filter`
**Auth:** OTP (`mock_code` in response only when `DEBUG=True`, random per request) → per-app httpOnly cookies via `X-App`. No self-serve admin endpoint — admins via `create_admin` CLI or existing-admin `PATCH /admin/users/{id}`. Mock payments only when `ALLOW_MOCK_PAYMENTS=True`.

## Testing
**Frontend:** `pnpm -r build` + `pnpm -r exec tsc --noEmit` + `pnpm -r lint` must pass. Vitest + RTL + msw (containers) + Playwright (E2E) are planned, not installed — don't assume they exist. Style: `*.test.tsx`, `it("renders user name")`.
**Backend:** `pytest` + `pytest-django` via `APIClient`. `tests/test_*.py` + `pytest.mark.django_db`.

## Security & Git
- Never commit `.env` (use `.env.example`). No secrets in code/logs. Validate via serializers + service checks. Sanitize rich text.
- Branches: `feat/|fix/|chore/` | Commits: imperative, ≤72 chars | Pre-commit: `pnpm lint && pnpm tsc --noEmit` / `uv run ruff check . && uv run pytest` | Never force-push `main`.

## Boundaries
Don't modify `@theme` design tokens in CSS, add deps without checking existing, edit `dist/node_modules/*.pyc/migrations`, or change API shape without updating both frontend types + backend serializers. Don't duplicate code between frontends — use `packages/shared/`.
