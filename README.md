# QTNXT — MasterLMS

A full-stack Learning Management System with separate learner and instructor apps, a shared Django REST API, and MySQL. Rebranded from Knoova to **QTNXT** (`Q` mark).

## Apps

| App | Path | Domain |
| --- | --- | --- |
| **Learner** | `frontend-learner/` | Browse, search, enroll, learn, track progress → `lms.com` |
| **Instructor** | `frontend-instructor/` | Create courses (2-step builder), manage curriculum, view analytics → `teach.lms.com` |
| **Backend** | `backend/` | Single shared Django + DRF API (`/api/v1/`) + MySQL |
| **Shared** | `packages/shared/` | Single `api()` client (cookies + envelope), `toEmbed`, `LESSON_KIND_BADGE`, `cn()`, shared types, icons |

Roles: `learner` · `instructor` · `admin`.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite`), TanStack Query, react-router-dom, Zustand (client state only)
- **Backend:** Django 5 + DRF + `djangorestframework-simplejwt` + `django-filter` + `django-environ`, Razorpay SDK
- **DB:** MySQL (sqlite fallback `backend/db.sqlite3`)
- **Tooling:** pnpm workspaces, `uv`, `pytest` + `ruff`, `oxlint`

## Repository layout

```
masterlms/
├── AGENTS.md              # code style + architecture (container/presenter, thin views)
├── DESIGN.md              # UI design system (QTNXT — full-width nav, gradient hero, lean cards)
├── package.json / pnpm-workspace.yaml
├── frontend-learner/      # Vite + React + TS + Tailwind v4
│   ├── src/pages/         # thin routes — Landing, Courses, CourseDetail, Learn, Activity, Leaderboard, Profile, Assignments, Login, CompleteProfile (compose containers)
│   ├── src/containers/    # CourseList, CourseDetail, Learn, Profile, Landing, Activity (TanStack Query data + logic)
│   └── src/components/    # pure presenters — CourseCard (lean 280px), CourseDetailView, LearnView, ActivityView, ActivityHeatmap, Header/TopNav, LandingView, PdfReader
├── frontend-instructor/   # Vite + React + TS + Tailwind v4
│   ├── src/pages/         # thin routes — Dashboard, Courses, CourseCreate, CourseEdit, CourseNew, Analytics, Assignments, Activity, Leaderboard, Profile, InstructorLanding, Login, CompleteProfile
│   ├── src/components/    # pure presenters — CourseCreateStep1/Step2, ProfileView, ErrorBoundary, InstructorHeader, …
│   └── src/containers/    # CourseCreate (2-step, zod), CourseManage (grid/list), CourseNew (RHF+zod), Profile (queries + mutations)
├── packages/shared/       # api-client (cookie `api()`, `absoluteMediaUrl`, `uploadFile`), toEmbed, LESSON_KIND_BADGE, LessonKind, cn(), icons (lucide-react), SharedUser/SharedApiCourse* types
└── backend/
    ├── config/            # settings, urls, wsgi (PAGE_SIZE=12, CookieJWT)
    ├── apps/
    │   ├── users/         # User + OTP + JWT + avatar URLField
    │   ├── courses/       # Course / Section / Lesson + Review (rating 1-5, average_rating)
    │   ├── enrollments/   # Enrollment + LessonCompletion + Certificate (QTNXT-XXXX)
    │   └── payments/      # Payment (Razorpay mock/live) + Invoice
    ├── scripts/seed.py
    └── .env.example
```

## Quick start

```bash
# root
pnpm install
pnpm --filter frontend-learner dev      # http://localhost:5173
pnpm --filter frontend-instructor dev   # http://localhost:5174

# Backend setup (Requires Python 3.11+)
cd backend

# If you don't have 'uv' installed, install it first:
# macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows (PowerShell): irm https://astral.sh/uv/install.ps1 | iex
# Or standard pip: pip install uv

uv sync
uv run python manage.py migrate
uv run python scripts/seed.py        # 4 sample courses
uv run python manage.py runserver    # http://localhost:8000
```

Other commands:

```bash
pnpm -r build
pnpm --filter frontend-learner exec tsc --noEmit
pnpm --filter frontend-instructor exec tsc --noEmit
pnpm --filter frontend-learner exec oxlint
pnpm --filter frontend-instructor exec oxlint
```

```bash
cd backend
uv run pytest
uv run ruff check .
uv run ruff format .
```

Configure `backend/.env`:

```env
DATABASE_URL=mysql://root:password@localhost:3306/masterlms
SECRET_KEY=replace-me
DEBUG=True
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

Without `DATABASE_URL` defaults to `backend/db.sqlite3`. Without Razorpay keys, payments run in **mock** mode (`order_mock_*`, `pay_mock_*`).

## API overview (`/api/v1/`, JWT Bearer + httpOnly cookies `access_token`/`refresh_token`)

### Auth
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/send-otp` | `{mobile}` | mock `1234` in dev, returns `mock_code` |
| `POST` | `/auth/verify-otp` | `{mobile, code}` | `{user, tokens, is_new}` + cookies |
| `PATCH` | `/auth/complete-profile` | `{name, email, age, avatar: URL}` | `avatar` is `URLField` — upload via `/upload/` first |
| `POST` | `/auth/become-instructor` | — | Promote |
| `GET`/`DELETE` | `/users/me` | — | Profile |

### Courses
| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/courses/?category=&search=&ordering=` | Published list, includes `price`, `original_price`, `pricing_type`, `section_count`, `lesson_count`, `student_count`, `average_rating`, `rating_count`, `created_at/updated_at` |
| `GET` | `/courses/{id}/` | Detail + `sections[].lessons[]` (`kind`, `duration`, `resource_url`, `quiz_data`) + `rating_count` |
| `POST` | `/courses/` | `{title, subtitle, description, what_you_will_learn: string[], category, level, price, pricing_type, original_price, cover_image}` |
| `PATCH` | `/courses/{id}/` | Owner only |
| `POST` | `/courses/{id}/publish/` | Owner |
| `PUT` | `/courses/{id}/curriculum/` | `{sections: [{title, lessons: [{title, kind, duration, resource_url, quiz_data}]}]}` |
| `POST`/`GET` | `/courses/{id}/rate/` | `{rating: 1-5}` auth+enrolled, recalculates `average_rating`; `GET` returns `{rating, average_rating, rating_count}` |
| `GET` | `/courses/mine/` | Instructor own courses |

### Enrollments / Progress / Certificates / Activity
| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/courses/{id}/enroll` | Free → immediate, paid → via payments |
| `GET` | `/me/courses` | `{course, progress, completed_lessons, enrolled_at}` |
| `POST` | `/courses/{id}/lessons/complete` | `{lesson_id}` → appends `completed_lessons`, `progress = len/total*100`, creates `LessonCompletion` |
| `GET` | `/me/activity/` | 26-week `[{date, count}]` from `LessonCompletion` (includes quiz) |
| `POST` | `/courses/{id}/certificate` | Requires `progress==100`, creates `QTNXT-XXXXXXXX` idempotent |
| `GET` | `/me/certificates` | `[{certificate_id, course, learner_name, enrolled_at, issued_at}]` |

### Payments / Invoices
| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/payments/create-order` | `{course_id}` → `order_id`, `amount` (paise), `currency`, `key_id`, `mock:true` if no keys |
| `POST` | `/payments/verify` | `{razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id}` → `PAID` + `enroll()` |
| `GET` | `/payments/my-payments` | Paid `Payment`s with nested `course` (`amount` paise, `razorpay_*`, `created_at`) |
| `POST` | `/upload/` | `multipart file → {url}` (`/media/...`) |

Response shape: `{data, error, meta: {page, total}}` (courses list paginated).

## Auth flow & Cookies
1. `POST /auth/send-otp` → 4-digit (returned `mock_code` for dev).
2. `POST /auth/verify-otp` → creates user if new, returns JWT + `httpOnly` `access_token`/`refresh_token`, frontend `credentials:"include"`, backend `CookieJWTAuthentication`.
3. New users → `/complete-profile` (name/email/age/avatar via `uploadFile` → `absoluteMediaUrl`).
4. `POST /auth/become-instructor` upgrades role.

Roles checked in `IsInstructorOrReadOnly` (courses) and `IsAuthenticated` (enroll/pay).

## Frontend ↔ Backend wiring
- `VITE_API_URL` default `http://localhost:8000/api/v1`, `TanStack Query` for server state, `Protected` redirects.
- Shared `toEmbed(input: string|null)` in `packages/shared/src/utils.ts` extracts `<iframe src>`, handles `youtu.be`, `youtube.com/watch?v=`, `/embed/`, `/shorts/`, `vimeo.com`, `loom.com/share→/embed/`; mp4 fallback via `absoluteMediaUrl` in instructor.
- `LESSON_KIND_BADGE: Record<LessonKind, {Icon, badge}>` in `packages/shared` — `Video/FileText/HelpCircle/Music/AlignLeft/LinkIcon` with `bg-[#3478ff]/bg-zinc-900/bg-yellow-400/bg-violet-600/bg-white border/bg-emerald-500` — used in learner Learn + CourseDetail and instructor ChapterSection.
- Avatar uploads always via `POST /upload/` → URL, never `data:` (avoids `URLField` 400).
- Pricing in **₹** (`toLocaleString("en-IN")`, `₹8,420`, `₹1,999`, `₹` icon on Dashboard, `₹449` in CourseNew) — `price = 0` means `Free`.

## Key UI flows (current)

- **Navbars — full-width sticky, centered** — `Header` (landing, now `sticky top-0`), `TopNav` (learner inner), `InstructorHeader` all `sticky top-0 z-30 flex w-full items-center justify-between bg-white px-4 sm:px-6 shadow-sm`, brand `Q` + `QTNXT` (+ `Teach` yellow pill on instructor), nav `absolute left-1/2 -translate-x-1/2 hidden sm:flex gap-5` with `Home / Courses / Activity / Leaderboard / Assignments (/ Dashboard / Analytics)` + `About`. Routes: `/`, `/courses`, `/activity`, `/leaderboard`, `/assignments`, `/dashboard`, `/analytics`, `/profile`, `/learn/:id`. Instructor routes now `w-full px-4 sm:px-6` (no `max-w-[1080px]`), learner Activity/Leaderboard also `w-full`.
- **Hero (learner)** — `HERO` image commented out, replaced with soft gradient blur (`from-[#eef2ff] via-[#fdf2ff] to-[#fff7ed]` + `c7d2fe/50 blur-[90px]`, `fbcfe8/40 blur-[100px]`, `dbeafe/30 blur-[100px]`), floating deco cards removed, copy bigger/wider (`max-w-[760px]`, `Learn skills that 34/54 lg:62`, `actually 42/66 lg:74`, `move you forward 36/58 lg:64`, subhead `max-w-[640px] 13/15px`), dark `text-zinc-900` on light.
- **Course creation (instructor)** — `/courses/create` 2-step, **1 Course details** (`title*`, `subtitle`, `description*` distinct, `What you'll learn` dot-split → `what_you_will_learn[]`, `Free / One-time` with `₹` total/discounted + `% off`, `pgFeesToLearner`) → **2 Build course** (`Course cover` `CoverPhotoUpload`, `Course content` chapters → lessons `video/pdf/quiz/link/audio/text`, video `YouTube URL / Embed code` toggle + `Upload mp4`, preview `toEmbed`/`absoluteMediaUrl`, `CourseBuilderHeader` Save/Publish/Preview). Edit (`/courses/:id`) reuses container, lands on Step 1 (no longer hidden), `PATCH` preserves `category/level`, includes `subtitle` + `learn`.
- **Instructor /courses** — filter bar `Add Filters ▼` (All/Published/Unpublished) + `Search by Course Title` + `grid/list` toggle (`#3478ff` grid, `#0f172a` list), grid `gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` cards `max-w-[280px] rounded-[20px]` with `UNPUBLISHED` ribbon, patterned cover grid, `Enrolled Learners i + timeAgo`, 5-icon bar (Info/Wrench/Pencil/Users/Eye → `StudentPreviewModal`).
- **Learner courses** — same bar (Add Filters by category + search + grid/list), grid lean cards `max-w-[280px] rounded-xl h-36` (no accent bg, `bg-zinc-100`), `Free/Bestseller/Enrolled` pill, title `13px bold`, subtitle `line-clamp-2`, instructor avatar + name, `sectionCount • lessonCount`, `Bestseller + ★ rating + N ratings`, price `₹` with strikethrough `originalPrice` or `Go to course →` (`/learn/:id`) if `enrolled` (`GET /me/courses` set, `price` hidden). List view shows `₹` with discount pill or `Go to course`.
- **Course detail (learner)** — `What you'll learn` `bg-[#fdfdfc] grid sm:grid-cols-2 ✓`, Curriculum accordion `rounded-2xl border` with `LESSON_KIND_BADGE` 5×5 circles + `Plus/Minus` lucide (`bg-[#3478ff]` when open), `duration` + `Quiz` pill, sticky enroll card `₹` (`₹` not `$`) with razorpay `QTNXT` name.
- **Learn (learner)** — `completed` hydrated from `GET /me/courses` (`completed_lessons`), `progress = completed.size/total`, `Mark complete` per lesson (`POST /lessons/complete`), persisted `progress` + `LessonCompletion` drives `GET /me/activity/`. Sidebar progress bar + `Course content` accordion. Below `Back to course` when `progress===100` shows `Mark course as complete →`; on click reveals 5× `Star` rating (`amber-400`); `Submit rating` → `POST /rate/` + `POST /certificate` (idempotent `QTNXT-XXXXXXXX`), then `You rated N ★` + `Average rating updated on course details & cards`. Average shown everywhere via `average_rating`/`rating`.
- **Profile (learner)** — `TopNav` sticky, header redesigned from `bg-white/10` cards to ink card `bg-[#0f172a]` with mesh blobs (`#1e3a5f`/`amber-400/10`) + `Q` watermark, `rounded-[20px]` avatar with `✓`, `LEARNER` pill, `name 22/26px black`, `Enrolled/Completed/Avg. progress` as `border-t` 3-col with `uppercase tracking-[0.15em]` labels (no backdrop cards). Below: `Edit profile` (upload via `/upload/`), `Account` + danger zone, `My courses` with progress bars, `Payment activity` (invoices from `GET /payments/my-payments`, `QTNXT-000012 • date • pay_… • Paid` + `amount` `₹` + `Invoice` print window), `Certificates Achieved` (`GET /me/certificates`, grid `sm:grid-cols-2` cards `Certified` emerald, `Learner/Enrolled/Completed` dates, `View certificate` → modal `border-[3px] border-[#0f172a]` professional template `Q QTNXT • Certificate of Completion • This certifies that {learner_name} • has successfully completed {course.title} • Enrolled on / Completed on • Certificate ID • qtnxt.com/verify/... • Print/Save PDF`), heatmap moved to `/activity`.
- **Activity (learner)** — full-width, GitHub-style tracker for `Mark as done` + quizzes: 3 stat cards (`Lessons done`/`Active days`/`Busiest day`), `Contribution graph` `rounded-[20px] border` with `last 26 weeks` pill, `Mon/Wed/Fri` gutter + month labels, `13×13 rounded-[3px] border` cells `zinc-100 → #dbeafe → #93c5fd → #2563eb → #0f172a` (ink scale, not emerald clone), hover `title` with `N lessons on YYYY-MM-DD`, `Less/More` legend matching scale.
- **Instructor profile** — now `InstructorHeader` sticky, `w-full` layout (no `max-w-[1080px]`), same avatar upload fix, pricing `₹` in `Your courses`.

## Code style
- Human-written small functions, no `any` (`unknown` + narrowing), `snake_case` Python, max 100 chars, `services.py` for logic, `select_related`/`prefetch_related`.
- Container-Presenter: `src/containers/*.container.tsx` fetches (TanStack Query, no `useEffect`+fetch), `src/components/*.tsx` pure props, one component per file, `src/hooks`/`lib`/`types`/`pages` thin.
- Tailwind v4 only (`@import "tailwindcss"`), `cn()`, `@theme` tokens, mobile-first `sm:`/`lg:`, `dark:` not needed.

## Testing
- **Backend:** `uv run pytest` (OTP + course CRUD/publish + enrollments progress + payments mock + reviews + certificates).
- **Frontend:** `pnpm -r build` + per-app `tsc --noEmit` + `oxlint` must pass; Vitest + RTL + msw + Playwright not installed yet (planned).

## Roadmap
- [x] httpOnly JWT cookies · [x] `/upload/` · [x] `toEmbed` yt/embed+iframe+shorts · [x] 2-step instructor builder (subtitle/description/learn/price ₹) · [x] lean learner cards (₹, subtitle 2 lines, instructor + counts, enrolled→Go to course) · [x] search + grid/list (both apps) · [x] persisted progress (`LessonCompletion` + `completed_lessons`) · [x] QTNXT rebrand + full-width centered nav + gradient hero (bigger/wider, banners removed) + sticky navbar · [x] `Mark course as complete` at 100% → star rating → `average_rating` + `rating_count` on cards/detail · [x] `Review` + `Certificate` (QTNXT-XXXX, enrolled/completed dates, professional print template) in profile + `Payment activity` invoices (Razorpay mock/live, ₹) + `Activity` GitHub heatmap with QTNXT ink scale + profile navbar + full-width instructor routes + profile header redesign
- [ ] Real Razorpay keys (currently mock when `RAZORPAY_KEY_ID` missing) · [ ] Playwright E2E · [ ] Certificate verification page `qtnxt.com/verify/:id`
