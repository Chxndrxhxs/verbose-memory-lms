# frontend-learner — QTNXT student app (`:5173`, served at `/`)

Browse, enroll, learn, take assignments, buy question packs.

## Run

```bash
pnpm --filter frontend-learner dev   # http://localhost:5173
```

Needs backend at `VITE_API_URL` (default `http://localhost:8000/api/v1`, see `.env.example`).
Auth is cookie-based (`credentials: include`) + per-app `X-App: learner` session.

## Routes (`src/App.tsx`, `basename: "/"`)

`/`, `/login`, `/complete-profile`, `/courses`, `/courses/:id`, `/learn/:id`,
`/activity`, `/leaderboard`, `/assignments`, `/assignments/:id`,
`/assignments/take/:attemptId`, `/assignments/transcript/:assignmentId`,
`/packs/:id`, `/profile`, `/about`. Course/learn/activity/assignment routes are
`Protected` (redirect to login when unauthenticated).

## Structure (Container-Presenter)

`src/pages/` thin routes → `src/containers/*.container.tsx` (TanStack Query data/logic)
→ `src/components/*.tsx` (pure props). Shared client/types in `packages/shared`
(`api()`, `absoluteMediaUrl`, `toEmbed`, `LESSON_KIND_BADGE`, `cn()`).

Key pieces: `CourseList`/`CourseDetail`/`Learn` (progress via `POST /lessons/complete`,
rating + `POST /certificate` at 100%), `Activity` (26-week heatmap from
`GET /me/activity/`), `AssignmentCatalog`/`Take`/`Result` (proctored + practice),
`PackDetail` (free claim vs paid via payments), `Profile` (courses, payments/invoices,
certificates).

## Checks

```bash
pnpm --filter frontend-learner exec tsc --noEmit
pnpm --filter frontend-learner exec oxlint
pnpm --filter frontend-learner build
```

Design source of truth: root `DESIGN.md` (this folder's `DESIGN.md` is a stale subset —
prefer the root file).
