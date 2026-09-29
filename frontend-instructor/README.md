# frontend-instructor — QTNXT teaching app (`:5174`, served at `/teach/`)

Create courses (2-step builder), manage curriculum, assignments (8-step wizard),
question packs (4-step builder), analytics.

## Run

```bash
pnpm --filter frontend-instructor dev   # http://localhost:5174
```

Needs backend at `VITE_API_URL` (default `http://localhost:8000/api/v1`, see `.env.example`).
Auth is cookie-based (`credentials: include`) + per-app `X-App: instructor` session.
Promote a learner via `POST /auth/become-instructor` (once only).

## Routes (`src/App.tsx`, `basename: "/teach"`)

`/`, `/login`, `/complete-profile`, `/dashboard`, `/courses` (+ `/courses/new` →
`/courses/create`, `/courses/:id` edit), `/activity`, `/leaderboard`, `/analytics`,
`/assignments` (+ `/new`, `/:id/edit`, `/:id/preview`), `/packs` (+ `/new`, `/:id/edit`),
`/profile`. Everything except landing/login is `Protected`.

## Structure (Container-Presenter)

`src/pages/` thin routes → `src/containers/` (`CourseCreate`, `CourseManage`,
`AssignmentCreate`/`AssignmentList`, `PackBuilder`/`PackList`, `Profile`) →
`src/components/` pure presenters (`CourseCreateStep1/Step2`, `AssignmentWizard` steps,
`PackInfoStep`/`PackModulesStep`/…​). Forms: `react-hook-form` + `zod`. Server state:
TanStack Query. Shared client/types in `packages/shared`.

## Checks

```bash
pnpm --filter frontend-instructor exec tsc --noEmit
pnpm --filter frontend-instructor exec oxlint
pnpm --filter frontend-instructor build
```

Design source of truth: root `DESIGN.md`.
