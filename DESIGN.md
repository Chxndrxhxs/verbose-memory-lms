# DESIGN.md — QTNXT (MasterLMS)

Source of truth for learner + instructor + admin aesthetics.
Stack: React + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite`).

## Brand

- **Name:** QTNXT · Mark: `Q` in `bg-[#0f172a]` circle (`h-7 w-7 rounded-full text-xs font-bold`)
- **Vibe:** calm, focused, human — soft neutrals + saturated pills on warm `#f6f5f1` canvas.
- **Logo:** `flex h-7 w-7 rounded-full bg-[#0f172a] text-white` + wordmark
  `text-sm font-bold tracking-tight QTNXT`
  (+ `Teach` `bg-yellow-400` pill on instructor, `Admin` label on admin)
- **Formerly:** Knoova
- **Mark variants:** learner footer + CTA use a `K` box, instructor landing pill uses `K`,
  admin sidebar uses a `Q` square (`rounded-[10px]` desktop / `rounded-lg` mobile).

## Colors

- **Canvas:** `bg-[#f6f5f1]` (warm stone, all apps)
- **Text:** `text-zinc-900` primary, `text-zinc-600` body, `text-zinc-500` mute,
  `text-zinc-400` watermark
- **Ink:** `bg-[#0f172a]` CTA / sidebar / primary buttons (deep navy)
- **Primary blue:** `bg-[#3478ff]` pills/CTAs, grid toggle active, AI actions, revenue bars
- **Yellow:** `bg-yellow-400 text-zinc-900` marker, Teach pill, Draft status
- **Emerald:** `bg-emerald-500/600 text-white` success/Publish/Extract/Free;
  soft `bg-emerald-100 text-emerald-800` for owned pills
- **Bestseller teal:** `bg-[#0f766e]` (learner cards)
- **Rust:** `bg-[#c45a3a]` UNPUBLISHED ribbon (instructor)
- **Borders:** `border-zinc-200`, card `border`
- **Hero gradient (learner, image commented out):** `from-[#eef2ff] via-[#fdf2ff] to-[#fff7ed]`
  + blobs `c7d2fe/50 blur-[90px]`, `fbcfe8/40 blur-[100px]`, `dbeafe/30 blur-[100px]`,
  radial `rgba(52,120,255,0.08)`
- **Feedback:** `amber-50/100 text-amber-800 border-amber-200` warnings,
  `red-50 text-red-600 border-red-200` errors/danger,
  `sky-100 text-sky-700` topic chips, `orange-100/500` review flags
- **Heatmaps:** learner activity blue-ink scale
  `[#ebf2fa → #cfe1f8 → #9bc1ec → #3b82f6 → #0f172a]`;
  instructor profile yellow scale (`zinc-100 → yellow-200/400/500/600`)
- **Certificate:** dark navy/gold (`#0a1128 / #101c44 / #1e3a5f` + `amber-200/300/400`)

## Typography

- **Imports:** `Inter 300-900`, `Instrument Sans 500-700`, `Instrument Serif 400 italic`,
  `Newsreader 300-500` (`index.html`; instructor omits Newsreader)
- **Tokens:** `--font-sans: Inter`, `--font-display: Instrument Sans`,
  `--font-serif: Instrument Serif`, `--font-news: Newsreader` (learner only)
- **CSS base:** `* {font-family: var(--font-sans)}`, `h1-h3 {font-family: var(--font-display)}`
- **Hero stack (centered, bigger/wider, dark on light):**
  - `Learn skills that` → `font-news font-light 34px sm:54px lg:62px` `text-zinc-900` `max-w-[760px]`
  - `actually` → `font-serif italic 42px sm:66px lg:74px` yellow marker
    `h-[10px] sm:h-[14px] lg:h-[16px] bg-yellow-400 -rotate-1`
  - `move you forward.` → `font-sans font-black 36px sm:58px lg:64px` `tracking-[-0.05em]`
  - Subhead `max-w-[640px] text-[13px] sm:text-[15px] font-light text-zinc-600`
    with `•` `font-semibold text-zinc-900`
- **Headings:** page `text-2xl sm:text-3xl font-bold tracking-tight` (learner),
  `text-2xl font-extrabold` (instructor dashboard), `text-xl font-extrabold` (admin),
  `text-xl font-bold` (instructor lists), step `text-lg font-bold`
- **Body:** `text-xs sm:text-sm leading-relaxed`, card title `13px font-bold leading-snug`,
  subtitle `12px line-clamp-2 leading-snug text-zinc-500`
- **Meta:** `text-[11px]/[10px]/[9px]` labels/pills
  (`font-bold uppercase tracking-widest` for section labels),
  `font-mono text-[11px]` for IDs, `tabular-nums` for timers/scores/durations

## Spacing & Radius

- **Outer gutters:** `px-3 sm:px-4` (learner sections), `px-4 sm:px-6` (full-width navs).
  Hero `min-h-[620px] sm:min-h-[700px] lg:min-h-[760px]` with `py-20`.
- **Section vertical (learner landing):** Trusted `py-10 sm:py-12`, Explore `pb-10 sm:pb-12`,
  Marquee `py-8 sm:py-10`, Statement `py-10 sm:py-12` inner `py-16 sm:py-20`,
  Features `py-6 sm:py-8 gap-5`, Testimonial `h-[480px] sm:h-[520px]`,
  FAQ `py-14 sm:py-20`, CTA `py-6 sm:py-8` inner `py-20 sm:py-24`
- **Radius scale:** outer `rounded-[28px]` (heroes, profile headers, preview modal),
  `rounded-[20px]/[22px]/[24px]` cards/players/modals, `rounded-2xl/rounded-xl` cards/inputs,
  `rounded-lg` rows/thumbs, pills/avatars/timers `rounded-full`
- **Shadows:** nav `shadow-sm` (full-width bar), cards `shadow-sm`, featured `shadow-md`,
  testimonial/dropdowns/modals `shadow-xl/2xl`

## Shared conventions

- `cn()` for conditionals, mobile-first `sm:`/`lg:`, no `dark:`.
- Container-Presenter intent: `*.container.tsx` fetches (TanStack Query), `*.tsx` pure props.
- Toasts: `fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900
  px-5 py-2.5 text-white shadow-xl`.
- Modals: overlay `fixed inset-0 bg-black/40-60` → panel
  `rounded-[20px]/rounded-3xl bg-white p-6 shadow-xl/2xl`.
- Prices in `₹` (`toLocaleString("en-IN")`), `Free` in emerald.

---

## Learner app

### Nav (Header + TopNav + MobileTabBar)

- **Desktop navs:** `sticky top-0 z-30 flex w-full items-center justify-between
  bg-white px-4 py-3 shadow-sm sm:px-6`
- **Brand left:** `Q` + `QTNXT`
- **Links centered:** `absolute left-1/2 -translate-x-1/2 hidden sm:flex gap-5
  text-sm font-medium text-zinc-600`:
  `Home / Courses / Activity / Leaderboard / Assignments / About` (`/about` route).
  Active `text-zinc-900`.
- **Actions right:** `ProfileMenu` or `Login / Get Started`
  (trigger `rounded-full border shadow-sm`, avatar `h-8 w-8 rounded-full ring-1`,
  dropdown `w-56 rounded-2xl border shadow-xl`,
  logout `hover:bg-red-50 hover:text-red-600`)
- **MobileTabBar:** `fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur sm:hidden`,
  `grid grid-cols-5`: Home / Courses / Activity / Ranks / Tests
  (`text-[10px] font-semibold`, icon `size=20`, active `text-zinc-900` else `text-zinc-400`).
  Body gets `padding-bottom: 68px` under `640px`.
- Note: `Header.tsx` and `TopNav.tsx` are near-duplicates (logged-out CTA differs).

### Hero (soft gradient blur, no image)

- Container `relative overflow-hidden rounded-[28px] bg-[#f8f7ff]` with gradient
  + 3 blurred blobs + radial
- HERO image commented out (`// HERO`), floating deco cards removed
- Copy `relative flex min-h-[620px] ... py-20 text-center` with eyebrow
  `border bg-white shadow-sm rounded-full` + `bg-[#0f172a]` primary CTA
  + `border bg-white` secondary

### Course filter + cards

- Filter: `flex flex-col gap-3 sm:flex-row` → left
  `flex flex-1 gap-2 rounded-2xl border bg-white p-2 shadow-sm` with `Filters` dropdown
  (Category/Level/Price pills, active `bg-zinc-900 text-white`)
  + search `flex-1 rounded-full bg-zinc-50` (`Search title, instructor, category…` + clear `✕`);
  right sort select (`popular/rating/priceLow/priceHigh`) + list/grid SVG toggle
  (list active `bg-[#0f172a]`, grid active `bg-[#3478ff]`)
- **Cards (grid):** `max-w-[280px] mx-auto rounded-xl border bg-white shadow-sm`,
  featured `scale-[1.02] shadow-md -rotate-[0.5deg]`
  - Media `h-36 bg-zinc-100 overflow-hidden`, top pill `absolute left-2 top-2 text-[9px]`
    (`Enrolled bg-emerald-600 / Free bg-emerald-500 / Bestseller bg-[#0f766e]`)
  - Title `13px font-bold line-clamp-2`, subtitle `line-clamp-2 text-xs text-zinc-500`
  - Instructor `h-5 w-5 rounded-full + text-[11px]`,
    counts `sectionCount • lessonCount text-[11px] text-zinc-500`
  - Meta pills `Bestseller bg-[#0f766e]`, `★ rating bg-zinc-900 text-[10px]`,
    `N ratings bg-zinc-100 text-[10px]`
  - Price row `border-t pt-2`: `₹ price 13px font-black` + strikethrough
    `originalPrice text-zinc-400` or `Go to course →` if enrolled;
    enrolled gets progress bar (`h-1.5 bg-zinc-100` → `bg-emerald-500`)
    + CTA `rounded-full bg-[#0f172a]`
- **List rows:** `flex gap-3 rounded-2xl border bg-white p-3 shadow-sm`,
  thumb `h-12 w-12 rounded-xl`, `%off bg-amber-400` pill,
  price pill `bg-emerald-600/bg-[#3478ff] rounded-full`

### Course detail & learn

- Detail shell `rounded-[28px] bg-white p-6 sm:p-8`, grid `lg:grid-cols-[1fr_360px] gap-6`
- `What you'll learn` `bg-[#fdfdfc] border p-5 grid sm:grid-cols-2` with `✓ bg-emerald-500` dots
- Curriculum `rounded-2xl border`, header `bg-zinc-50`, toggle
  `h-6 w-6 rounded-full bg-[#3478ff]/bg-white`, lesson kind badge (5×5 circle)
  + `Quiz bg-yellow-400`
- Sticky sidebar `hidden lg:block sticky top-[88px] rounded-[20px] border shadow-sm`,
  preview `h-44` + Play button, price `text-[28px] font-black`,
  enroll `rounded-full bg-[#0f172a]` / enrolled `bg-emerald-600`,
  wishlist/Share/Gift/Coupon row
- Learn topbar: floating `max-w-[1280px] rounded-full bg-white shadow-sm`,
  back `h-7 w-7 rounded-full bg-zinc-900`, progress pill + bar
  (`h-1.5 w-24 bg-zinc-100` → `bg-[#0f172a]`)
- Player `rounded-[20px] bg-white shadow-sm` (video `aspect-video bg-black`,
  text `prose prose-zinc`, pdf `PdfReader` dark `rounded-[20px] bg-zinc-900`,
  audio dark, link CTA, quiz block)
- Rating: 5× stars (`amber-400`/`zinc-300`) → `POST /rate/` + `POST /certificate`
  (idempotent `QTNXT-XXXXXXXX`)

### Assignments (rebuilt 2026-09-28)

- **Catalog:** page `rounded-[28px] bg-white p-8 sm:p-10 shadow-sm`,
  `h1 Tests text-2xl font-bold tracking-tight`,
  3-select filter row (Subject/Area/Topic, `select rounded-xl border bg-white text-sm`),
  rows `rounded-2xl border p-4 hover:border-zinc-400 hover:shadow-sm`,
  CTA `rounded-full bg-zinc-900 Start→`, owned `bg-emerald-100 text-emerald-800 Owned`,
  packs-for-sale `rounded-2xl border bg-[#fbfaf7]`, skeletons `animate-pulse bg-zinc-100`
- **Detail:** `max-w-3xl rounded-[28px] bg-white p-8 sm:p-10 shadow-sm`,
  breadcrumb `text-xs uppercase tracking-wide text-zinc-400` (Category → Sub → Inter),
  meta pills `rounded-full bg-zinc-100` + negative-marking `bg-amber-50 text-amber-800`,
  instructions `rounded-2xl bg-zinc-50` collapsible, modules `rounded-[24px] border p-6`,
  Start `rounded-full bg-[#0f172a]`,
  confirm modal `max-w-md rounded-3xl shadow-2xl` + Begin `bg-emerald-600`
- **Take:** TopBar `sticky border-b bg-white/95 backdrop-blur`,
  timer `rounded-full tabular-nums bg-zinc-900 text-white`
  (`<60s` → `animate-pulse bg-red-100 text-red-700`,
  practice → `bg-emerald-100 text-emerald-800 Untimed practice`),
  Submit `bg-emerald-600 rounded-full`, progress `h-1.5 bg-zinc-200` → `bg-emerald-500`,
  question `rounded-[22px] border p-5 sm:p-6`, number `h-7 w-7 rounded-full bg-zinc-900`,
  chips `rounded-full text-[11px]` (topic `sky-100`, review `orange-100`),
  options `rounded-xl border text-sm`, checked `border-zinc-900 bg-zinc-900 text-white`
  - Nav `rounded-2xl border p-4`: Previous / Clear (`red-50`) /
    Review later (`orange-50`) / Save & Next (`zinc-900`)
  - Palette `rounded-[22px] border p-5`, cells `h-9 w-9 rounded-lg text-xs font-bold`
    (answered `emerald-500` / unanswered `red-500` / review `orange-500` /
    not-visited `zinc-200`, current `ring-2 ring-zinc-900 ring-offset-2`)
  - Proctor: merged banner (`amber-50` lockdown / `emerald-50` ready),
    fullscreen/tab/copy/paste/F12 guard, violations auto-submit,
    `CameraGate` + `LiveCamera` (`w-44 rounded-2xl border-red-500` + REC pill)
    + `SubmitConfirmModal`, keyboard `A–D/1–6/arrows`
- **Result:** status `rounded-full Passed bg-emerald-100 / Not passed bg-red-100`,
  stats `grid-cols-2 sm:grid-cols-4 rounded-2xl bg-zinc-50 p-4`
  (label `uppercase text-zinc-400`, value `text-lg font-bold tabular-nums`,
  good `emerald-600` / bad `red-500`),
  actions Retake `bg-zinc-900 rounded-full` + Back `border`,
  review filter `rounded-full bg-zinc-100 p-1` (All / Needs work / Correct),
  items `rounded-2xl border p-4`, option states
  (correct `emerald-50` / selected-wrong `red-50` / default `zinc-50`),
  explanation `rounded-xl bg-zinc-50 text-xs`

### Packs (learner)

- `max-w-3xl rounded-[28px] bg-white p-8 sm:p-10 shadow-sm`, breadcrumb uppercase,
  price `Free bg-emerald-100` vs `₹ bg-[#0f172a] text-white rounded-full` + strikethrough,
  module select `rounded-[24px] border p-6` active `border-zinc-900 shadow-sm` + emerald check,
  badge `Proctored bg-amber-100 / No proctoring bg-emerald-100`,
  CTA `w-full rounded-full`: owned `bg-emerald-600`, free `bg-[#0f172a]`,
  paid `bg-amber-600 Buy·₹`

### Profile / activity / leaderboard / about / certificates / payments

- **Profile header:** `relative overflow-hidden rounded-[28px] bg-[#0f172a] p-6 sm:p-8`
  with mesh blobs + `Q` watermark `text-white/[0.04]`,
  avatar `rounded-[20px] h-20 w-20 sm:h-24` with `✓` emerald badge,
  `LEARNER` pill, name `22/26px black`,
  stats `grid-cols-3 border-t border-white/10`
  labels `uppercase tracking-[0.15em] text-white/40`, `Edit profile bg-white rounded-full`
  + `View activity →`
- **Activity:** shell `rounded-[20px] bg-white p-6 sm:p-8 shadow-sm`,
  stats `rounded-2xl bg-zinc-50 p-4`,
  graph `rounded-[20px] border p-4 sm:p-6` + `last 26 weeks` pill,
  cells `22px rounded-md border` blue-ink scale, gutter `Sun/Wed/Fri`, legend Less/More
- **Leaderboard:** formula `quiz 40% · completion 30% · certs 20% · streak 10%`,
  season toggle `rounded-full bg-zinc-900 p-1` (active `bg-white text-zinc-900`),
  table header `grid-cols-[52px_1fr_148px_152px_92px] bg-zinc-50 uppercase`,
  rank medals (gold/silver/bronze gradients), `TierBadge rounded-full border`,
  RR bar `h-2 bg-zinc-100` (inline width), me sticky `bottom-3 bg-zinc-900 text-white`
- **About:** navy hero `rounded-[28px] bg-[#0f172a]` + watermark,
  stats `rounded-2xl bg-white`, pillars/journey cards,
  step `h-10 w-10 rounded-full bg-yellow-400`
- **Certificates:** dark navy/gold modal
  (`max-w-[760px] rounded-[24px] bg-[#0a1128] ring-amber-200/30`,
  gold corners, `Q` watermark `font-serif italic text-white/[0.04]`, seal gradient,
  `tracking-[0.18–0.32em]`, name `font-serif text-3xl sm:text-4xl`,
  meta `grid-cols-2 sm:4 rounded-xl bg-white/5 font-mono`,
  actions Print `bg-amber-300 rounded-full` + Close)
- **Payments:** rows `rounded-2xl border bg-zinc-50 p-3`,
  `Invoice rounded-full bg-[#0f172a]` opens Tax Invoice print window
  (navy/gold, `QTNXT-000012`)

### Auth (learner)

- Split `lg:grid-cols-2`, image + `bg-gradient-to-t from-black/70`,
  form `bg-white px-6 sm:px-10 lg:px-16`
- Inputs `rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm
  focus:border-zinc-900 focus:bg-white`,
  OTP `text-xl tracking-[0.7em] text-center`, submit `rounded-full bg-[#0f172a] py-3.5 font-bold`

---

## Instructor app

### Header / nav

- **InstructorHeader:** `sticky top-0 z-30 w-full bg-white px-4 py-3 shadow-sm sm:px-6`,
  brand `Q` + `QTNXT` + `Teach bg-yellow-400 text-[10px]`
- **Links centered:** `absolute left-1/2 -translate-x-1/2 hidden lg:flex gap-5
  text-sm font-medium text-zinc-600`:
  `Dashboard / Courses / Activity / Leaderboard / Analytics / Assignments`.
  Active `text-zinc-900 font-semibold`.
  **Packs has no nav entry** (via Assignments → Question packs or `/packs`).
- **Actions right:** `ProfileMenu` or `Login`, `+ Create course bg-[#0f172a] hidden sm:inline-flex`
- **MobileTabBar:** `fixed bottom-0 lg:hidden`, `grid-cols-6`:
  Home / Courses / Activity / Ranks / Stats / Tests. Body clearance `68px` under `1024px`.
- **CourseBuilderHeader** (builders only): floating
  `sticky top-3 rounded-full bg-white px-3 py-2 shadow-lg`,
  back `h-9 w-9 rounded-full`, publish `rounded-full border`, save `rounded-full bg-[#0f172a]`

### Course filter + cards

- Filter `flex flex-col sm:flex-row justify-between`, left
  `rounded-2xl border bg-white p-2 shadow-sm`,
  `Add Filters rounded-full border` dropdown (`All/Published/Unpublished`,
  active `bg-zinc-900 text-white`),
  search `rounded-full bg-zinc-50 focus:bg-white focus:ring-1`,
  right list/grid SVG toggle (list `bg-[#0f172a]`, grid `bg-[#3478ff]`)
- Grid `gap-4 sm:grid-cols-2 lg:grid-cols-3`, cards
  `rounded-[20px] border bg-white shadow-sm hover:shadow-md`
  - Cover `h-36`: patterned (`bg-[#1e2e5a]` / `bg-[#faf6ef]` + 22px grid + triangle/circle)
    or image
  - Ribbon `UNPUBLISHED bg-[#c45a3a] -rotate-[32deg]`
  - Title `text-sm font-semibold text-[#3478ff]`, `Enrolled Learners` row + `timeAgo`,
    action bar 5 icons `Info/Wrench/Pencil/Users/Eye` → preview modal
- List rows `rounded-2xl border p-3`, thumb `h-16 w-24 rounded-xl`,
  status pill (`amber-400` vs `emerald-500`)

### Assignment list + 8-step wizard (rebuilt 2026-09-28)

- **List:** shell `rounded-[20px] bg-white p-6 shadow-sm`,
  search `rounded-xl bg-zinc-50 pl-9` + status select,
  `New assignment rounded-full bg-[#0f172a]`,
  rows `rounded-xl border-zinc-100 shadow-sm hover:shadow-md`,
  icon `h-10 w-10 rounded-full bg-zinc-900`,
  `STATUS_COLORS`: draft `bg-yellow-400`, published `bg-emerald-500 text-white`,
  archived `bg-zinc-300`,
  `ActionMenu` dropdown (Edit/Preview/Duplicate/Publish/Archive/Delete),
  pagination `h-8 w-8 rounded-full border`
- **Wizard stepper:** `ol flex gap-2 overflow-x-auto`, step `rounded-2xl border px-3.5 py-2`
  (active `bg-zinc-900 text-white shadow-sm` / done `bg-emerald-50 border-emerald-200`),
  label `text-xs font-bold`, caption `max-w-32 truncate text-[11px]`,
  footer Back/Save `rounded-full border` + Next `bg-[#0f172a]` + Publish `bg-emerald-600`,
  body `min-h-[60vh]`
- Steps: 0 BasicInfo (`rounded-2xl p-6`, Details/Schedule/Marking/Delivery sections,
  fields `rounded-xl bg-zinc-50 focus:bg-white`, checks `rounded-xl border bg-zinc-50`);
  1 Upload (dropzone `rounded-xl border-2 border-dashed p-10`,
  progress `h-1.5 bg-zinc-200` → `bg-zinc-900`);
  2 Generate (two `rounded-2xl p-6` cards, extract `bg-emerald-600`, AI `bg-[#3478ff]`,
  topics `rounded-xl bg-zinc-50`, notices `rounded-xl p-3 text-xs`);
  3 Review (toolbar `rounded-xl bg-zinc-50 p-3`, search/selects `rounded-xl bg-white text-xs`,
  cards `rounded-xl border shadow-sm`, flagged `border-amber-300`,
  number `h-6 w-6 rounded-full bg-zinc-900`, pills `text-[10px]`
  review `amber-100` / topic `sky-100`, options letter `h-7 w-7 rounded-full border-2`
  active `emerald-500`, difficulty `green/red/amber-100`);
  4 Model (`grid sm:grid-cols-3`, card `rounded-xl border-2 p-5`
  active `bg-zinc-900 text-white shadow-lg`);
  5 Configure (practice note `rounded-xl bg-zinc-50`; Auto-arrange `rounded-full border`,
  Add test `bg-zinc-900`; Unplaced `border-amber-200 bg-amber-50`, Place `bg-zinc-900`;
  TestPanel `rounded-xl border shadow-sm`, SetPanel `rounded-lg bg-zinc-50 ml-4`);
  6 Preview (exam header `rounded-xl bg-[#f6f5f1]`, timer `rounded-full bg-zinc-900` live,
  section pills active `bg-zinc-900 text-white`, option active `border-[#3478ff] bg-blue-50`,
  explanation `bg-amber-50 text-amber-700`, pager `rounded-xl bg-zinc-50`);
  7 Publish (summary `rounded-xl bg-zinc-50` + labels `uppercase text-zinc-400`,
  checks emerald/red, warnings `bg-amber-50`, errors `bg-red-50`)
- Publish needs only a published model + questions in leaf steps (no source-PDF gate).

### Pack list + 4-step builder (rebuilt 2026-09-28)

- **List:** shell `rounded-[20px] bg-white p-6 shadow-sm`,
  `New pack rounded-full bg-[#0f172a]`, cards `rounded-2xl border p-4`,
  cover `h-16 w-12 rounded-lg border` (else `bg-zinc-100 No cover`),
  status `text-[11px]` (draft `amber-100` / published `emerald-100` / archived `zinc-200`),
  actions `rounded-full border text-xs` / publish `bg-emerald-600` /
  delete `border-red-200 text-red-600`, delete modal `max-w-sm rounded-3xl shadow-2xl`
- **Builder:** 4 steps Details/Questions/Formats & price/Review,
  stepper `rounded-2xl border`
  (active `bg-zinc-900 text-white` / done `bg-emerald-50` / locked `opacity-50`),
  footer Back `border` + Save & continue `bg-[#0f172a]`
  - Info: `rounded-2xl p-6 shadow-sm`, inputs `rounded-xl px-3.5 py-2.5 focus:border-zinc-900`,
    preview `h-36 w-28 rounded-xl border`, category `grid sm:grid-cols-3`
  - Questions: chips `rounded-full bg-zinc-100 text-[11px]`, rows `rounded-xl border p-3`
    flagged `border-amber-300`, `CategoryBadge text-[10px]` (`sky-100` vs `zinc-100`),
    options active `border-emerald-200 bg-emerald-50`, bank rows `rounded-xl border p-3`
    + Add `bg-[#0f172a]` / added `bg-zinc-100`
  - Modules: cards `rounded-xl border-2 p-4` active `bg-zinc-900 text-white`,
    preview `rounded-xl bg-zinc-50`, price pill (Free `emerald-100` vs `zinc-900 text-white`)
  - Publish: hero `rounded-2xl shadow-sm` + cover `h-36 w-28`, price + strikethrough,
    topic chips (`amber-100` untagged), learner cards `rounded-xl bg-zinc-50`,
    checks `h-5 w-5 rounded-full bg-emerald-100`, publish `bg-emerald-600`

### Dashboard / analytics / activity / profile / landing

- **Dashboard:** canvas `px-4 py-6 sm:px-6`, `h1 text-2xl font-extrabold`,
  `StatCard rounded-2xl bg-white p-5 shadow-sm` (icon `h-8 w-8 rounded-full`,
  label `uppercase tracking-widest text-zinc-400`, value `text-2xl font-black`),
  panels `rounded-[20px] bg-white p-6 shadow-sm`, rows `rounded-xl border`,
  quick links `rounded-xl bg-zinc-50 hover:bg-white`
- **Analytics:** same canvas, `rounded-2xl bg-white p-6`,
  revenue bar `h-2 bg-zinc-100` → `bg-[#3478ff]`,
  mini bars `h-[70px] bg-emerald-500` (inline heights). No chart lib.
- **Activity:** filters `rounded-2xl border p-3`, selects `rounded-full bg-zinc-50 text-xs`,
  rows `rounded-2xl border shadow-sm` + icon `h-9 w-9 rounded-full ring-1`
  (amber/emerald/sky/yellow tints)
- **Profile:** header
  `rounded-[28px] bg-gradient-to-br from-zinc-900 via-amber-900 to-zinc-900`,
  avatar `rounded-full border-4 border-yellow-400/40`, `Teach bg-yellow-400` pill,
  stats `rounded-2xl bg-white/10 backdrop-blur`, heatmap `h-3 w-3 rounded-sm` yellow scale
- **InstructorLanding:** photo hero `rounded-[28px] h-[620/700/760px] object-cover`
  + dark gradients, pill nav `rounded-full bg-white shadow-lg` (`K` badge),
  H1 30/36/32px stack + yellow marker, CTAs `rounded-full bg-white` / glass,
  steps `rounded-2xl bg-white p-6` + `h-8 w-8 rounded-full bg-[#0f172a]`

---

## Admin app

- **Layout:** root `min-h-screen bg-[#f6f5f1]`;
  desktop sidebar `fixed inset-y-0 left-0 hidden w-60 flex-col bg-[#0f172a] p-4 md:flex`,
  brand `h-8 w-8 rounded-[10px] bg-white text-[#0f172a] Q` + `QTNXT` white + `ADMIN text-zinc-400`,
  nav items `rounded-xl px-3 py-2.5 text-sm` (active `bg-white/10 text-white`
  else `text-zinc-400`),
  icons `size=16`: Dashboard / Users / Courses / Enrollments / Payments /
  Assignments / Categories;
  mobile header `sticky md:hidden bg-white shadow-sm` + pill scroller `bg-[#0f172a]`
  (active `bg-white text-[#0f172a]`); content `md:ml-60` > `max-w-[1280px]`
- **Shared:** `Card rounded-2xl border bg-white p-5 shadow-sm`
  (`CardHeader h2 text-base font-bold + p text-xs text-zinc-500`),
  `Pagination` (`Page X of Y`, `h-8 w-8 rounded-lg border`),
  `ConfirmDialog` (`max-w-sm rounded-2xl shadow-xl`,
  icon `h-10 w-10 rounded-full bg-red-50`, Delete `bg-red-600 rounded-full`)
- **Lists:** header + filter Card + table Card + Pagination + skeleton
  (`h-4 bg-zinc-200`) / error / empty.
  Table head `text-[11px] uppercase tracking-wider text-zinc-400`.
  Status pills `rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase`:
  published/paid `emerald-100/700`, draft/pending `amber-100/700`,
  failed `red-100/700`, admin `bg-[#0f172a] text-white`,
  instructor `violet-100/700`, learner `emerald-100/700`
- **Login:** centered `max-w-md rounded-3xl shadow-2xl` on `bg-[#0f172a]` page,
  `Lock h-9 w-9 rounded-full bg-[#0f172a]`, phone `rounded-xl bg-zinc-50` + `+91`,
  OTP `text-xl tracking-[0.7em]`, submit `rounded-full bg-[#0f172a]`

## Rules

- `cn()` for conditionals, mobile-first `sm:`/`lg:`, no `dark:`.
- No CSS modules. `style={{ width/height }}` allowed only for dynamic bars
  (progress, RR, revenue, heatmap levels) and certificate artwork.
- Container-Presenter: `*.container.tsx` fetches (TanStack Query), `*.tsx` pure props.
- `pnpm --filter frontend-learner build` + `frontend-instructor` must pass.
- Testimonial photo `1490750967868` kept.
