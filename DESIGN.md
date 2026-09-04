# DESIGN.md — QTNXT (MasterLMS)

Source of truth for learner + instructor aesthetics. Stack: React + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite`).

## Brand

- **Name:** QTNXT · Mark: `Q` in `bg-[#0f172a]` circle (`h-7 w-7 rounded-full text-xs font-bold`)
- **Vibe:** calm, focused, human — soft neutrals + saturated pills on warm `#f6f5f1` canvas.
- **Logo:** `flex h-7 w-7 rounded-full bg-[#0f172a] text-white` + wordmark `text-sm font-bold tracking-tight QTNXT` (+ `Teach` `bg-yellow-400` pill on instructor)
- **Formerly:** Knoova

## Colors

- **Canvas:** `bg-[#f6f5f1]` (warm stone)
- **Text:** `text-zinc-900` primary, `text-zinc-600` body, `text-zinc-500` mute, `text-zinc-400` watermark
- **Ink:** `bg-[#0f172a]` CTA / price deep navy
- **Primary blue:** `bg-[#3478ff]` pills/CTAs, active grid toggle
- **Yellow:** `bg-yellow-400 text-zinc-900` marker, tags
- **Emerald:** `bg-emerald-500/600 text-white` success/✓/Free
- **Borders:** `border-zinc-200`, card `border`
- **Hero gradient (current, image commented out):** `from-[#eef2ff] via-[#fdf2ff] to-[#fff7ed]` + blobs `c7d2fe/50 blur-[90px]`, `fbcfe8/40 blur-[100px]`, `dbeafe/30 blur-[100px]`, radial `rgba(52,120,255,0.08)`

## Typography

- **Imports:** `Inter 300-900`, `Instrument Sans 500-700`, `Instrument Serif 400 italic`, `Newsreader 300-500` (`index.html`)
- **Tokens:** `--font-sans: Inter`, `--font-display: Instrument Sans`, `--font-serif: Instrument Serif`, `--font-news: Newsreader`
- **Hero stack (centered, bigger/wider, dark on light):**
  - `Learn skills that` → `font-news font-light 34px sm:54px lg:62px` `text-zinc-900` `max-w-[760px]`
  - `actually` → `font-serif italic 42px sm:66px lg:74px` yellow marker `h-[10px] sm:h-[14px] lg:h-[16px] bg-yellow-400 -rotate-1`
  - `move you forward.` → `font-sans font-black 36px sm:58px lg:64px` `tracking-[-0.05em]`
  - Subhead `max-w-[640px] text-[13px] sm:text-[15px] font-light text-zinc-600` with `•` `font-semibold text-zinc-900`
- **Headings:** `text-2xl sm:text-3xl font-bold tracking-tight`, FAQ/statement `26px sm:36px font-extrabold`
- **Body:** `text-xs sm:text-sm leading-relaxed`, card title `13px font-bold leading-snug`, subtitle `12px line-clamp-2 leading-snug text-zinc-500`

## Spacing & Radius

- **Outer gutters:** `px-3 sm:px-4` (learner sections), `px-4 sm:px-6` (full-width navs). Hero `min-h-[620px] sm:min-h-[700px] lg:min-h-[760px]` with `py-20`.
- **Section vertical:** Trusted `py-10 sm:py-12`, Explore `pb-10 sm:pb-12`, Marquee `py-8 sm:py-10`, Statement `py-10 sm:py-12` inner `py-16 sm:py-20`, Features `py-6 sm:py-8 gap-5`, Testimonial `h-[480px] sm:h-[520px]`, FAQ `py-14 sm:py-20`, CTA `py-6 sm:py-8` inner `py-20 sm:py-24`
- **Radius:** Hero outer `rounded-[28px]`, course cards learner `rounded-xl max-w-[280px] h-36` / instructor `rounded-[20px] h-36`, pills `rounded-full`, enroll `rounded-[20px]`
- **Shadows:** nav `shadow-sm` (full-width bar), cards `shadow-sm`, featured `shadow-md`, testimonial `shadow-xl`

## Components

### Full-width Centered Nav (Header + TopNav + InstructorHeader)

- **All navs:** `sticky top-0 z-30 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm sm:px-6`
- **Brand left:** `Q` + `QTNXT` (+ `Teach` on instructor)
- **Links centered:** `absolute left-1/2 -translate-x-1/2 hidden sm:flex lg:flex gap-5 text-sm font-medium text-zinc-600`:
  - Learner: `Home / Courses / Activity / Leaderboard / Assignments / About (#faq)`
  - Instructor: `Dashboard / Courses / Activity / Leaderboard / Analytics / Assignments`
  - Active `text-zinc-900` / `font-semibold`
- **Actions right:** `ProfileMenu` or `Login / Get Started`, instructor `+ Create course` `bg-[#0f172a]`

### Hero (soft gradient blur, no image)

- Container `relative overflow-hidden rounded-[28px] bg-[#f8f7ff]` with gradient + 3 blurred blobs + radial
- HERO image commented out (`// HERO`), floating deco cards removed
- Copy `relative flex min-h-[620px] ... py-20 text-center` with eyebrow `border bg-white shadow-sm rounded-full` + `bg-[#0f172a]` primary CTA + `border bg-white` secondary

### Course Filter Bar (both apps)

- `flex flex-col sm:flex-row gap-3 justify-between`: left `flex flex-1 gap-2 rounded-2xl border bg-white p-2 shadow-sm` with `Add Filters ▼` `rounded-full border` dropdown + `Search by Course Title` `rounded-full bg-zinc-50`; right `grid/list` toggle `rounded-xl border overflow-hidden` (`bg-[#3478ff]` grid active, `bg-[#0f172a]` list)
- Learner filters by category (derived), instructor by `draft/published`

### Course Cards (learner — lean)

- `flex flex-col max-w-[280px] mx-auto rounded-xl border bg-white shadow-sm`
- Media `h-36 bg-zinc-100 overflow-hidden` (no accent `bg-[#3478ff]` behind image, removed), `Free`/`Bestseller`/`Enrolled` pill `absolute left-2 top-2 rounded-full text-[9px]`
- Title `13px font-bold line-clamp-2`, subtitle `line-clamp-2 text-xs leading-snug text-zinc-500` (full text, 2 rows)
- Instructor `h-5 w-5 rounded-full + text-[11px] font-medium`, counts `sectionCount • lessonCount` `text-[11px] text-zinc-500`
- Pills `Bestseller bg-[#0f766e]`, `★ rating bg-zinc-900 text-[10px]`, `N ratings bg-zinc-100 text-[10px]`
- Price row `border-t pt-2`: `₹ price 13px font-black` + strikethrough `originalPrice` `text-xs text-zinc-400` or `Go to course →` (`/learn/:id`) if `enrolled` (price hidden); `Enrolled` replaces `Bestseller`/`Free` top pill
- Featured `scale-[1.02] shadow-md -rotate-[0.5deg]`

### Course Cards (instructor /courses)

- Grid `gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` cards `max-w-[280px] rounded-[20px] border bg-white shadow-sm`, ribbon `UNPUBLISHED bg-[#c45a3a] -rotate-[32deg]`, patterned cover `c7d2fe/fbcfe8` grid, title `text-[#3478ff]`, `Enrolled Learners i + timeAgo`, action bar 5 icons `Info/Wrench/Pencil/Users/Eye` → preview modal

### Course Detail & Learn (learner)

- Detail grid `lg:grid-cols-[1fr_360px] gap-6`, `What you'll learn` `bg-[#fdfdfc] border p-5 grid sm:grid-cols-2 ✓ bg-emerald-500`, Curriculum `rounded-2xl border` accordion `bg-zinc-50` header with `LESSON_KIND_BADGE` (5×5 circle `Video/FileText/HelpCircle/Music/AlignLeft/LinkIcon`) + `Plus/Minus` lucide `h-6 w-6 rounded-full bg-[#3478ff] text-white / bg-white text-zinc-700`
- Learn: `completed` hydrated from `GET /me/courses` (`completed_lessons`), `progress = completed.size/total`, `Mark complete` per lesson (`POST /lessons/complete`), persisted `progress` + `LessonCompletion` drives `GET /me/activity/`. Sidebar progress bar + `Course content` accordion. Below `Back to course` when `progress===100` show `Mark course as complete →`; on click reveal 5× `Star` (`amber-400`/`zinc-300`) + `Submit rating` → `POST /rate/` + `POST /certificate` (idempotent `QTNXT-XXXXXXXX`), then `You rated N ★` + `Average rating updated`. `Certificate` model `QTNXT-…` drives profile.
- Prices in `₹` (`toLocaleString("en-IN")`), `Free` in emerald

### Profile (learner) — redesigned header

- `TopNav` sticky, header `relative overflow-hidden rounded-[28px] bg-[#0f172a] p-6 sm:p-8` with mesh blobs (`#1e3a5f`/`amber-400/10`) + `Q` watermark `text-white/[0.04]`, avatar `rounded-[20px] h-20 w-20 sm:h-24` with `✓` emerald badge, `LEARNER` pill, `name 22/26px black`, `Enrolled/Completed/Avg. progress` as `border-t border-white/10` 3-col with `uppercase tracking-[0.15em] text-white/40` labels (no backdrop cards), `View activity →` link

### Activity (learner) — GitHub heatmap

- Full-width `w-full px-4 sm:px-6`, 3 stat cards `Lessons done/Active days/Busiest day` (`rounded-2xl bg-zinc-50`), `Contribution graph` `rounded-[20px] border bg-white p-4 sm:p-6` with `last 26 weeks` pill, `Mon/Wed/Fri` gutter + month labels, `13×13 rounded-[3px] border` cells `zinc-100 → #dbeafe → #93c5fd → #2563eb → #0f172a` (ink scale, not generic emerald), hover `title` `N lessons on YYYY-MM-DD`, `Less/More` legend matching scale

### Certificates & Payments (learner profile)

- `Payment activity` (`GET /payments/my-payments`, `QTNXT-000012 • date • pay_… • Paid` + `₹` + `Invoice` print window `Q QTNXT`)
- `Certificates Achieved` (`GET /me/certificates`, grid `sm:grid-cols-2` cards `Certified` emerald, `Learner/Enrolled/Completed` dates, `View certificate` → modal `border-[3px] border-[#0f172a]` professional template `Q QTNXT • Certificate of Completion • This certifies that {learner_name} • has successfully completed {course.title} • Enrolled on / Completed on • Certificate ID • qtnxt.com/verify/... • Print/Save PDF`)

## Rules

- `cn()` for conditionals, mobile-first `sm:`/`lg:`, no `dark:`.
- No CSS modules, no `style` objects.
- Container-Presenter: `*.container.tsx` fetches (TanStack Query), `*.tsx` pure props.
- `pnpm --filter frontend-learner build` + `frontend-instructor` must pass.
- Testimonial photo `1490750967868` kept.
