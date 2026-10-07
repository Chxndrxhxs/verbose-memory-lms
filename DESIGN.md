# DESIGN.md — QTNXT (MasterLMS)

Source of truth for learner + instructor + admin aesthetics.
Stack: React + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/typography`).

## Design language

Three registers share one spine — **flat, squared, hairline-ruled**:

- **Structure comes from the rule, not the shadow.** Panels are `border border-rule`
  on a paper ground. Elevation is reserved for overlays (modals, dropdowns, toasts).
- **Edges are square.** Buttons, panels, badges, inputs, cards carry no `rounded`.
  Rounding is reserved for genuine capsules: avatars, seals, dots, the certificate medallion.
- **One accent per app, and it means one thing.** Learner `gold` = progress and
  achievement (your place in a course, your streak, your certificate) — never decoration.
  Instructor `signal` = the instructor's own identity (Teach badge, top rank, own row).
  Admin has no accent.
- **State is semantic, never colour alone.** `live` / `hold` / `halt` / `flight`
  always pair an icon and a word (see Badge).
- **One focus treatment per app:** global `:focus-visible { outline: 2px solid ink; outline-offset: 2px }`.
  No `outline-none` anywhere.
- `cn()` for conditionals, mobile-first `sm:`/`lg:`, no `dark:`.

## Brand

- **Name:** QTNXT · Mark: square `Q` in `bg-ink` (`h-7 w-7` / `text-[13px] font-bold`,
  inverse text) + wordmark `text-sm font-semibold tracking-tight`.
- Role marks: learner none, instructor `Teach` (`border border-signal-deep/40 bg-signal
  px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink`),
  admin `ADMIN` (`text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint`).
- **Formerly:** Knoova (legacy localStorage keys `knoova_*` are purged on admin boot).

## Tokens

All colours are oklch. Each app declares its own `@theme` in `src/index.css`.

### Learner — "quiet room" (warm ivory + aubergine + marigold)

| Token | Value | Use |
|---|---|---|
| `room` / `room-raised` / `room-sunk` | oklch(0.977/0.995/0.945 · 85°) | canvas / cards / recessed |
| `room-deep` | oklch(0.19 0.025 335) | aubergine ink panel (heroes, certificate, PDF chrome) |
| `ink` / `ink-muted` / `ink-faint` / `ink-inverse` | oklch(0.235/0.505/0.665/0.985 · 335°) | text scale |
| `rule` / `rule-strong` | oklch(0.9 / 0.835 · 85°) | hairlines |
| `gold` / `gold-deep` / `gold-wash` | oklch(0.845/0.6/0.96 · 78°/62°/88°) | progress & achievement only |
| `live`+`live-soft` | oklch(0.54 · 152°) | enrolled, passed, completed |
| `hold`+`hold-soft` | oklch(0.63 · 68°) | in progress, pending, proctored |
| `halt`+`halt-soft` | oklch(0.55 · 25°) | failed, destructive |
| `flight`+`flight-soft` | oklch(0.5 · 250°) | informational |

### Instructor — "studio slate" (cool slate + ink + signal yellow)

| Token | Value | Use |
|---|---|---|
| `slate-ground` / `slate-panel` / `slate-sunk` / `slate-deep` | oklch(0.968/0.995/0.945/0.205 · 250°/255°) | canvas / cards / recessed / deep |
| `ink` / `ink-muted` / `ink-faint` / `ink-inverse` | oklch(0.215/0.495/0.655/0.985 · 255°) | text scale |
| `rule` / `rule-strong` | oklch(0.895 / 0.83 · 250°) | hairlines |
| `signal` / `signal-deep` / `signal-wash` | oklch(0.855/0.62/0.965 · 92°/78°/95°) | instructor identity only |
| `live`/`hold`/`halt`/`flight` (+soft) | oklch(0.55·158° / 0.63·75° / 0.552·25° / 0.5·245°) | semantic state |

### Admin — "ledger" (paper + ink, no accent)

| Token | Value | Use |
|---|---|---|
| `paper` / `paper-raised` / `paper-sunk` | oklch(0.977/0.988/0.958 · 85°) | canvas / cards / recessed |
| `ink` / `ink-muted` / `ink-faint` / `ink-inverse` | oklch(· 265°) | text scale |
| `rule` / `rule-strong` | hairlines | separators |
| `live`/`hold`/`halt`/`flight` (+soft) | same roles as learner | status |

## Typography

- **Loaded** (`index.html`): `Inter 300–900`, `Instrument Sans 500–700`, and —
  learner only — `Instrument Serif italic` + `Newsreader 300–500`.
- **Tokens:** `--font-sans: Inter`, `--font-display: Instrument Sans`,
  `--font-serif: Newsreader` (learner) / `Instrument Serif` (instructor),
  `--font-mono: "IBM Plex Mono"` (**declared but never loaded** in any `index.html` —
  falls back to `ui-monospace`).
- **Base:** `h1–h3` use the display face with `letter-spacing: -0.02em`;
  learner `.prose` reads in Newsreader at `1.0625rem/1.75`.
- **Headings:** page `text-2xl font-semibold` (all three apps); learner landing H1
  `text-[40px] sm:text-[54px] lg:text-[60px] font-semibold tracking-[-0.035em]`.
- **Labels:** eyebrows `text-[10px]–text-[11px] font-semibold uppercase tracking-[0.12em]–[0.16em] text-ink-faint`;
  `.tnum` for tabular numerals; IDs in `font-mono text-[11px]–xs`.

## Shape, elevation, motion

- **Radius:** none on controls/containers; `rounded-sm` (2px) on instructor wizard
  step chips; `rounded-full` only for capsules (avatars, seals, dots, option letters).
- **Shadows (overlays only):** modals `shadow-[0_24px_60px_-15px_rgba(28,25,23,0.35)]`,
  dropdowns `shadow-[0_18px_44px_-12px_rgba(30,18,36,0.26)]`, toasts `shadow-xl`.
- **Transitions:** `duration-100 ease-out` on controls; `.row-hover` 120ms
  `cubic-bezier(0.2,0,0,1)` → `room-sunk`/`slate-sunk`/`paper-sunk`.
- **Motion:** `prefers-reduced-motion` kill switch in all three `index.css`.

## Shared components (per-app copies, same contract)

- **Button** — variants `primary` (`bg-ink text-ink-inverse border-ink hover:bg-ink/88`),
  `secondary` (`bg-{room|slate}-panel text-ink border-rule-strong hover:bg-{...}-sunk`,
  the default), `ghost`, `danger` (outline `text-halt border-halt/35 hover:bg-halt-soft`),
  `live` (`bg-live`); learner adds `gold` (`bg-gold text-ink border-gold-deep hover:bg-gold/90`).
  Sizes `sm h-8 px-2.5 text-xs gap-1.5` / `md h-10 px-4 text-sm gap-2` / `lg h-12 px-6`;
  `iconOnly` → `h-8 w-8` / `h-10 w-10`. Square.
- **Segmented** — `inline-flex items-center gap-0.5 border border-rule bg-{...}-sunk p-0.5`,
  selected `bg-{...}-panel text-ink shadow-[0_1px_2px_…]`, `role="tablist"` + `aria-selected`.
- **Badge** — tones `live` / `hold` / `halt` / `flight` / `muted` (+ `gold` learner, `signal`
  instructor), each with a lucide icon (`size={11} strokeWidth={2.5}`) so status survives
  greyscale; chip `inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px]
  font-semibold uppercase tracking-[0.08em]`; `statusTone()` maps backend statuses.
- **Modal** — focus-trap, Escape, scroll lock; overlay `bg-ink/45`; panel
  `border-rule-strong bg-{room|slate}-panel` (learner `tone="ink"` → `bg-room-deep`);
  learner dark footer `border-white/10 bg-black/15`.
- **Panel** — `border border-rule bg-{...}-panel p-5` (`flush` drops padding; tones
  `sunk` / `ink` / `gold` / `signal`); `PanelHeader`, `Eyebrow`, `PageHeader`
  (`border-b border-rule-strong pb-4`), `PageShell` (`max-w-[1200px]`, `wide` →
  `[1560px]` learner / `[1600px]` instructor), `Stack`.
- **Controls** — `Input`/`Textarea`/`Select` (`w-full border border-rule bg-{...}-panel
  px-3 py-2–2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink`; Select
  uses an inline-SVG chevron, `appearance-none`), `Field` (label + `text-halt` error),
  `SearchInput` (leading icon, `pl-9`, debounced busy ping), `DefinitionList`,
  `Notice` (info/warn/error/live/gold).
- **DataGrid** — `GridPanel` (`Panel flush overflow-hidden`; toolbar
  `border-b border-rule bg-paper px-4 py-3`; footer `border-t`), `GridHead`/`Th`
  (`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint`),
  `Tr` (`.grid-row border-b border-rule last:border-0`), `GridSkeleton`
  (`h-3 animate-pulse bg-{...}-sunk`), `GridMessage` (empty/error taught states),
  `Pagination` (`h-8 w-8 border border-rule` buttons, `tnum` "Page X of Y"),
  `ListPanel`/`ListMessage`/`SkeletonRows`/`Pager` (learner).
- **Toast** — `fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink
  px-5 py-2.5 text-sm font-medium text-ink-inverse shadow-xl` (square). Several
  learner views inline the same markup instead of importing it.
- **Progress** — `h-1.5 bg-rule/50` track, `gold` fill (learner) / `live` (admin).

---

## Learner app

Dev port 5173. Tokens: quiet room (above).

### Nav (Header + MobileTabBar + ProfileMenu)

- **Header:** `sticky top-0 z-40 border-b border-rule bg-room-raised/95 backdrop-blur
  supports-[backdrop-filter]:bg-room-raised/80`, inner `h-14 max-w-[1560px] px-4 sm:px-6`.
  Square `Q` mark + `QTNXT`. Links **left-aligned** `hidden sm:flex`:
  `px-3 py-2 text-[13px] font-medium text-ink-muted`, active `text-ink` +
  `absolute -bottom-px h-[2px] bg-ink` underline. Logged-out: `Sign in` text link +
  `Get started` (`h-9 border border-ink bg-ink px-4 text-sm font-semibold hover:bg-ink/88`).
  `TopNav.tsx` is a 10-line alias of `Header` (the old duplication is gone).
- **MobileTabBar:** `fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-room-raised/95
  pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden`, `grid grid-cols-5`
  Home / Courses / Assignments / Activity / Ranks; `text-[10px] font-semibold`,
  active `text-ink` else `text-ink-faint`, icons `size={19} strokeWidth={2.1}`.
  Body gets `padding-bottom: 68px` under `639.5px`.
- **ProfileMenu:** trigger `h-9 border border-rule bg-room-raised px-1.5 hover:bg-room-sunk`;
  dropdown `w-60 border border-rule-strong bg-room-raised` + overlay shadow; items
  `px-3 py-2 text-[13px] font-medium text-ink-muted hover:bg-room-sunk hover:text-ink`;
  logout `hover:bg-halt-soft hover:text-halt`.

### Landing

- Hero: `mx-auto grid w-full max-w-[1200px] gap-12 px-4 pb-16 pt-10 sm:pt-16
  lg:pb-24`, copy wrapped in `max-w-3xl` — **single reading column**. No gradient,
  no orbs, no marquee, no testimonials, no mock player (removed with the rebrand).
- Eyebrow `text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint` +
  `h-1.5 w-1.5 bg-gold-deep` dot. Primary CTA `h-12 border border-ink bg-ink px-6
  text-sm font-semibold hover:bg-ink/88`; secondary `border border-rule-strong
  bg-room-raised hover:bg-room-sunk`.
- Stats row `grid max-w-lg grid-cols-3 gap-px border border-rule bg-rule`
  (`bg-room-raised px-4 py-4` cells, real catalogue counts).
- Sections: catalogue on `border-t border-rule bg-room-raised` (`sm:grid-cols-2
  lg:grid-cols-4`); "How it works" pillars in `grid gap-px border border-rule bg-rule`
  with `h-9 w-9 border border-rule bg-room-sunk text-ink-muted` icon boxes; dark
  aubergine assessment band `bg-room-deep` (gold eyebrow `text-gold`, stat grid
  `border-white/12 bg-white/12`, **gold CTA** `border border-gold bg-gold text-ink
  hover:bg-gold/90`); FAQ accordion `divide-y divide-rule border-y border-rule`
  (open chevron `border-ink bg-ink text-ink-inverse`); footer `border-t border-rule
  bg-room-raised`.

### Course catalogue + cards

- Filter bar `flex flex-1 items-center gap-2 border border-rule bg-room-raised p-2`:
  `Filters` `Button secondary sm` toggling `absolute left-0 top-[calc(100%+8px)] z-20
  w-52 border border-rule-strong bg-room-raised p-3 shadow-lg` (pills `border px-3 py-1
  text-xs font-semibold`, selected `border-ink bg-ink text-ink-inverse`),
  `SearchInput`, sort `Select`, `Segmented` list/grid toggle. Count line `text-xs
  text-ink-muted` + `Clear all` underline.
- **CourseCard:** `flex h-full flex-col border border-rule bg-room-raised
  transition-colors hover:border-rule-strong` — square, no shadow, no tilt.
  Media `aspect-[16/9] bg-room-sunk`; top-left `Badge live` (Enrolled/Free) /
  `Badge gold` (Featured — the old `scale-[1.02] -rotate-[0.5deg]` is gone).
  Title `line-clamp-2 text-[15px] font-semibold hover:underline`; instructor
  `h-5 w-5 bg-room-sunk text-[10px]` initial; counts `tnum mt-2 text-xs text-ink-faint`.
  Enrolled: `Progress` + CTA `flex h-9 items-center justify-center border border-ink
  bg-ink text-xs font-semibold text-ink-inverse`. Price row `border-t border-rule pt-3`:
  Free `text-live`, original `text-ink-faint line-through`, `Star fill-gold text-gold`.
- **List rows:** `flex items-center gap-3 border border-rule bg-room-raised p-3
  transition-colors hover:bg-room-sunk`, thumb `h-12 w-16 border border-rule`,
  discount chip `border border-gold-deep/35 bg-gold-wash px-1.5 py-0.5 text-[10px]
  font-semibold text-gold-deep`, free pill `border-live/25 bg-live-soft text-live`.

### Course detail & learn

- Detail: `grid gap-6 lg:grid-cols-[1fr_360px]`, no page chrome. H1 `text-2xl
  sm:text-[28px] font-semibold`; subtitle `font-serif text-sm text-ink-muted`;
  rating `text-gold-deep` ★.
- "What you'll learn" `Panel tone="sunk"` with `h-4 w-4 bg-live text-[10px] font-semibold
  text-ink-inverse` ✓ squares; curriculum `Panel flush` (section headers
  `bg-room-sunk px-4 py-3`, expand toggle `bg-ink text-ink-inverse` open /
  `bg-room-raised border border-rule` closed, quiz `Badge gold`).
- Sticky sidebar `Panel flush sticky top-[88px]`: price `text-2xl font-semibold`
  (`text-live` with coupon), progress `h-1.5 bg-rule/50` → `bg-gold`, enrolled CTA
  `h-12 w-full border border-live bg-live text-sm font-semibold text-ink-inverse
  hover:bg-live/90`, `Enroll now` `Button primary lg`, wishlist/Share/Gift/Coupon
  `Button secondary` (+ `Segmented` send-gift/redeem flow, `WELCOME10` coupon dialog,
  success `border border-live/25 bg-live-soft p-4 text-center`).
- **Learn:** floating topbar `sticky top-0 z-30 flex justify-center bg-room px-3 py-3`
  → `border border-rule bg-room-raised px-3 py-2` (square); back `h-7 w-7 bg-ink
  text-ink-inverse`; progress `Badge live` + `h-1.5 w-24 bg-rule/50` → `bg-gold`;
  Exit `border border-rule px-3 py-1.5 text-xs font-semibold text-ink-muted`.
- Player `overflow-hidden border border-rule bg-room-raised`: lesson title bar
  `flex items-center justify-between gap-4 border-b border-rule px-4 py-3`
  (`truncate text-sm font-semibold` title, `tnum text-xs text-ink-muted`
  duration); video `aspect-video bg-black` — YouTube via the keyless IFrame
  API (`start` param, position kept in `lms:video-pos:{lessonId}`),
  Vimeo/Loom as provider iframes, native `<video controls>` for uploaded
  mp4/webm/mov (same resume key); text lessons use `.prose`
  (**carries a stale `prose-zinc` class** — its overrides remap to room tokens);
  PDF via `PdfReader` (`bg-room-deep` chrome, gold `Open` button
  `border border-gold-deep bg-gold`); audio `bg-room-deep`;
  quiz options `border border-rule bg-room-raised`, submitted `border-live/40
  bg-live-soft` / `border-halt/40 bg-halt-soft`, verdict `border border-live/25
  bg-live-soft text-live`. Tabs `border-b-2 px-3 py-2 text-sm font-semibold`,
  active `border-ink text-ink`; sidebar accordion chevrons `bg-ink` / `bg-room-sunk`,
  completed `bg-live text-ink-inverse`, active `bg-ink text-ink-inverse`;
  rating stars `border-gold-deep bg-gold text-gold-deep`.

### Assignments

- **Catalog:** `PageShell`; `h1 Tests text-2xl font-semibold`; board filter is a
  single `Select`. "My tests" rows `group flex items-center gap-4 border border-rule
  bg-room-raised p-4 transition-colors hover:border-rule-strong hover:bg-room-sunk`
  with CTA chip `inline-flex shrink-0 items-center gap-1 border border-ink bg-ink
  px-3 py-1.5 text-xs font-semibold text-ink-inverse`; owned `Badge live`;
  test-package cards `border border-rule bg-room-sunk p-4 hover:bg-room-raised`;
  skeletons `animate-pulse bg-room-sunk`; empty `border border-dashed border-rule-strong
  p-8 text-center text-sm text-ink-muted`.
- **Detail:** `max-w-3xl Panel p-8 sm:p-10`; breadcrumb `text-[10px] font-semibold
  uppercase tracking-[0.14em] text-ink-faint`; description `font-serif text-sm
  text-ink-muted`; meta `Badge muted` + negative-marking `Badge hold`; instructions
  `border border-rule bg-room-sunk p-4` collapsible; module cards `Panel p-6`
  (module label `Badge muted bg-ink text-ink-inverse`, `Start` `Button primary`);
  confirm in shared `Modal` with `Begin` `Button primary`.
- **Take (section-scoped, rebuilt 2026-10):**
  - TopBar `sticky top-0 z-30 border-b border-rule bg-room-raised/95 px-3 py-3
    backdrop-blur`; timer `border px-3 py-1.5 text-sm font-semibold` (`<60s` →
    `animate-pulse border-halt/25 bg-halt-soft text-halt`, else `border-rule
    bg-room-sunk text-ink`; practice → `Badge live` "Untimed practice");
    `Submit` `Button primary sm`.
  - `ProctorStrip`: fullscreen `border-live/25 bg-live-soft text-live`, else
    `border-hold/30 bg-hold-soft text-hold` + `Enter fullscreen` `Button primary sm`.
  - `SectionTabs` (`role="tablist"`, `border-b border-rule`): tabs `-mb-px border-b-2
    px-1 py-3 text-sm font-semibold` — active `border-ink text-ink`, unlocked
    `border-transparent text-ink-muted`, locked `cursor-not-allowed text-ink-faint` +
    `Lock size={12}`, submitted `Check size={12} text-live`. The tab row carries the
    **`Submit section` / `Submit exam`** `Button primary sm` (exam label on the last
    section).
  - Lock banner inside the question panel: `mb-4 flex items-center gap-2 border
    border-live/25 bg-live-soft px-3 py-2 text-xs font-semibold text-live` + `Check`
    — "Section submitted — answers are locked"; options and action bar disable.
  - Palette is **scoped to the current section** (sliced by `section.startIndex/
    endIndex`, global numbering, header shows section name + `Q{start}–Q{end}`):
    cells `tnum inline-flex h-9 w-9 text-xs font-semibold` — answered `bg-live
    text-ink-inverse hover:bg-live/88`, unanswered `bg-halt …`, review `bg-hold …`,
    not-visited `bg-room-raised text-ink-muted border border-rule-strong`, locked
    `cursor-not-allowed bg-room-sunk text-ink-faint`, current `ring-2 ring-ink
    ring-offset-1`.
  - Options `flex w-full items-center gap-3 border px-4 py-3 text-sm`; checked
    `border-ink bg-ink text-ink-inverse` with `bg-room-raised text-ink` letter chip
    (`h-6 w-6 rounded-full` — the only rounding on screen).
  - Action bar: `Mark for review & next` / `Clear response` (`Button secondary sm`),
    `Previous` + `Save & next` (`Button ghost sm`, save disabled on a section's last
    question), `Submit section` / `Submit exam` (`Button primary sm`); save status
    `text-live` "Answer saved" / `text-halt` "Offline — retrying" (auto-save debounce
    1500ms). Auto-submit warning at ≤300s: `fixed bottom-4 border border-halt bg-halt
    px-4 py-2 text-xs font-semibold text-ink-inverse`.
  - `CameraGate` (hand-rolled non-dismissible dialog `border-rule-strong
    bg-room-raised p-8` + `Notice tone="warn/error"`, insecure-context notice),
    `LiveCamera` (`fixed bottom-4 right-4 w-44 border border-halt bg-black`, REC pill
    `border-halt/40 bg-room-deep/80`, "Camera ON" dot `bg-live`),
    `SubmitConfirmModal` (shared `Modal` + `Notice tone="warn"`, footer
    `grid-cols-1 sm:grid-cols-2` with `sm` buttons). Keyboard: `A–D` / `1–6` / arrows.
- **Result:** `max-w-3xl`; pass `Badge live` / `Badge halt`; stats `border border-rule
  bg-room-sunk p-4` (labels `text-[10px] uppercase tracking-[0.14em] text-ink-faint`,
  values `text-live`/`text-halt`); Retake `border border-ink bg-ink px-6 text-sm
  font-semibold text-ink-inverse hover:bg-ink/88` + Back `border border-rule-strong
  bg-room-raised hover:bg-room-sunk`; section table `row-hover border-b border-rule`;
  review filter `Segmented sm`; option rows `border-live/30 bg-live-soft text-live`
  (correct) / `border-halt/30 bg-halt-soft text-halt` (selected-wrong) / `border-rule
  bg-room-sunk text-ink-muted`; explanation `border border-rule bg-room-sunk p-3 text-xs`.

### Packs

`max-w-3xl Panel p-8 sm:p-10`; breadcrumb uppercase `text-ink-faint`; free `Badge live`;
price `border border-ink bg-ink px-4 py-1.5 text-sm font-semibold text-ink-inverse` +
`text-ink-faint line-through` original; description `font-serif`; meta `Badge muted tnum`;
module picker `flex w-full flex-wrap items-center justify-between gap-3 border
bg-room-raised p-6` (active `border-ink bg-room-sunk`); proctoring `Badge hold`
(proctored, `Lock`) / `Badge live`; CTA `Panel p-6` with `Button primary lg block`
("Start now" / "Get for free" / `Buy now · ₹…`); footnote `text-[11px] text-ink-muted`.

### Profile / activity / leaderboard / about / certificate / payments

- **Profile:** header `border border-ink bg-room-deep p-6 sm:p-8 text-ink-inverse`
  with `bg-ink-inverse/[0.05] blur-[50px]` / `bg-gold/10 blur-[40px]` blobs and
  `text-[110px] text-ink-inverse/[0.04]` "Q" watermark; avatar `border
  border-ink-inverse/20 bg-room-raised` + `bg-live ring-2 ring-room-deep` ✓ badge;
  `Learner` pill `bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase
  tracking-[0.14em] text-ink`; stats `grid-cols-3 gap-6 border-t border-ink-inverse/10
  pt-6` (labels `uppercase tracking-[0.15em] text-white/40`); `Edit profile`
  `Button gold sm`; danger zone `border border-halt/25 bg-halt-soft p-3` +
  `Button danger` (type-"delete" confirm); my-courses rows `border border-rule
  bg-room-sunk p-3 hover:bg-rule/40` + `bg-gold` progress bars; payment rows with
  `Button primary sm` "Invoice"; certificates `Badge gold` "Certified" +
  `Button primary sm` "View certificate".
- **Activity:** stat cells `border border-rule bg-room-sunk p-4`; graph `Panel p-4
  sm:p-6` containing `border border-rule bg-room-sunk p-4`; heatmap uses a **gold
  scale** (`bg-room-sunk border-rule` → `bg-gold-wash border-gold/25` → `bg-gold/40`
  → `bg-gold/70 border-gold-deep/45` → `bg-gold-deep`), 22px squared cells,
  "last 26 weeks" chip `tnum border border-rule bg-room-sunk px-2.5 py-1 text-[11px]`.
- **Leaderboard:** `Segmented sm` season toggle; filter bar `border border-rule
  bg-room-raised p-3` with three `Select`s; table header
  `grid-cols-[52px_1fr_148px_152px_92px] border-b border-rule bg-room-sunk px-4
  py-2.5 text-[10px] uppercase tracking-[0.14em]`; rows `row-hover border-b border-rule
  px-3 py-3`, top-3 `bg-gold-wash`; medals — #1 `bg-gold text-ink border border-gold-deep`,
  #2 `bg-room-sunk border-rule-strong`, #3 `bg-gold-wash text-gold-deep
  border-gold-deep/45`; `TierBadge` still maps the **stale shared `TIER_META`**
  raw palette (see leftovers); RR bar `h-2 bg-rule/50`; "me" sticky pill
  `sticky bottom-3 border border-ink bg-ink px-4 py-3 text-ink-inverse shadow-lg`.
- **About:** hero `border border-ink bg-room-deep px-6 py-14 text-center text-ink-inverse`
  + `text-ink-inverse/[0.04]` "Q" watermark; eyebrow pill `border border-ink-inverse/15
  bg-ink-inverse/10 text-ink-inverse/80` + `Sparkles`; stat cards `border border-rule
  bg-room-raised p-5 text-center`; pillars `border border-rule bg-room-sunk p-5` +
  `h-9 w-9 bg-ink text-ink-inverse` icon boxes; journey steps `border border-rule p-4`
  + `h-10 w-10 border border-gold-deep/40 bg-gold text-sm font-semibold text-ink`
  number tiles; feature chips `border-flight/25 bg-flight-soft text-flight`; FAQ
  `border border-rule bg-room-sunk px-5 py-4` + `text-live` `CheckCircle2`.
- **Certificate:** overlay `bg-ink/70 p-4 backdrop-blur-sm`; frame `border
  border-gold-deep/40 bg-room-deep p-2 shadow-2xl` → inner `border border-gold/35
  bg-room-deep px-6 py-8 text-ink-inverse` with `radial-gradient(rgba(252,211,77,0.09)
  1px, transparent 1px)` dot grid; `GoldCorners` (`h-10 w-10 border-gold/35` L-corners);
  serif "Q" watermark `text-ink-inverse/[0.04]`; `bg-gold` seal (rounded); labels
  `tracking-[0.18em]–[0.32em]` gold; name `font-serif text-3xl sm:text-4xl`; gold
  diamond divider; medallion `h-16 w-16 rounded-full bg-gold`; meta cells `border
  border-ink-inverse/10 bg-ink-inverse/5 px-3 py-2.5` + `font-mono text-[11px]`;
  footer `border-t border-ink-inverse/10`; actions `Button gold` "Print / Save PDF"
  (`window.print()`) + `Button secondary` "Close", wrapped in `print:hidden`.
- **Payments:** rows `border border-rule bg-room-sunk p-3` + `Button primary sm`
  "Invoice" → `window.open` of the standalone invoice (below).

### Auth

- **Login:** centered `max-w-[420px]` on `bg-room` (no split screen); phone `Field` +
  `flex border border-rule bg-room-raised focus-within:border-ink` with `+91` prefix
  `border-r border-rule px-3`; OTP `tnum w-full border border-rule bg-room-raised
  px-3 py-3.5 text-center text-xl tracking-[0.5em]`; `Button primary lg block`;
  ghost "Resend code" with 30s cooldown.
- **CompleteProfile:** `lg:grid lg:grid-cols-2`; left `bg-room-raised px-6 py-8` form
  (logo mark `bg-ink` — **still a stale "K" letter**, brand is Q); avatar `h-16 w-16
  rounded-full border border-rule bg-room-sunk`; right Pexels photo +
  `bg-gradient-to-t from-room-deep/80 via-room-deep/25 to-transparent` overlay.
- **Wishlist** (`/wishlist`): empty `border border-dashed border-rule-strong
  bg-room-raised` + `ListMessage`; Remove buttons `hover:border-halt/30
  hover:bg-halt-soft hover:text-halt`.

---

## Instructor app

Dev port 5174. Tokens: studio slate (above). Signal yellow is reserved for the
instructor's identity — it never appears on buttons or decoration.

### Nav (InstructorHeader + MobileTabBar + ProfileMenu)

- **Header:** `sticky top-0 z-40 border-b border-rule bg-slate-panel/95 backdrop-blur
  supports-[backdrop-filter]:bg-slate-panel/80` (sticky, not fixed — it keeps its
  place in the flow), inner `h-14 max-w-[1600px] px-4 sm:px-6`. Square `Q` +
  `QTNXT` + `TeachMark`. Links `hidden lg:flex min-w-0 flex-1 items-center gap-0.5`:
  Dashboard / Courses / Assignments / Packs / Analytics / Activity / Leaderboard,
  `px-2.5 py-2 text-[13px] font-medium`, active `text-ink` + `absolute inset-x-2.5
  -bottom-px h-[2px] bg-ink` underline. A learner session hides the nav entirely
  (`canTeach` check). Logged-out: `Sign in` (`h-8 border border-ink bg-ink px-3
  text-xs font-semibold`).
- **MobileTabBar:** `fixed inset-x-0 bottom-0 z-30 border-t border-rule
  bg-slate-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden`,
  `grid grid-cols-5` — Home / Courses / Tests / Stats / Activity (five, not six:
  the old bar dropped Packs entirely); `text-[10px] font-semibold`, active `text-ink`
  else `text-ink-faint`, icons `size={19} strokeWidth={2.1}`. Body clearance
  `68px` under `1023.5px`.
- **CourseBuilderHeader** (builders): `sticky z-30 border border-rule
  bg-slate-panel/95 px-3 py-2 backdrop-blur`, positioned by `useNavOffset()` which
  measures `[data-site-header]` and sets `top: navOffset + 8` (no magic number);
  back `Button ghost sm iconOnly` (`ArrowLeft`), title `truncate text-sm
  font-semibold sm:text-base` + `saveStatus text-[11px] font-normal text-ink-faint`,
  preview `Button secondary sm iconOnly` (`Eye`), Publish `Button secondary sm`
  (`!disabled && "border-live/35 text-live hover:bg-live-soft"`, `ArrowUpRight`),
  Save `Button primary sm` (`Cloud`, "Saving…" while saving).

### Dashboard

`min-h-screen bg-slate-ground`; `New assignment` CTA `inline-flex h-10 items-center
gap-2 border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse
hover:bg-ink/88`; stat rail `grid gap-px border border-rule bg-rule lg:grid-cols-4`
(`bg-slate-panel p-5` cells, dominant metric `sm:col-span-2`, icon `size={15}
strokeWidth={2.2} text-ink-faint`, `tnum` values, captions `text-xs text-ink-muted`);
`grid gap-6 lg:grid-cols-[1.6fr_1fr]`: recent-enrolments `Panel`
(`PanelHeader border-b border-rule px-5 py-3`, `ul divide-y divide-rule`, rows
`row-hover flex items-center gap-3 px-5 py-3`, avatar `h-8 w-8 bg-slate-sunk
text-xs font-semibold text-ink-muted`) and next-actions `Panel` (rows `group flex
items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-sunk`, `ArrowRight
text-ink-faint group-hover:translate-x-0.5 group-hover:text-ink`).

### Assignment wizard (8 steps)

- Chrome: `builderCardClass` = `border border-rule bg-slate-panel p-5 sm:p-6`
  (`lib/builder.ts`; also `builderFieldClass` `w-full border border-rule bg-slate-panel
  px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors
  duration-100 focus:border-ink`, `builderLabelClass` `block text-xs font-semibold
  text-ink-muted`).
- Header: eyebrow `text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint`
  ("New assignment" / "Edit assignment"), `h1 mt-1 text-2xl font-semibold text-ink`,
  `Step {n} of 8 · {label}` `text-[15px] text-ink-muted tnum`.
- Stepper: `ol mt-5 flex items-center gap-2 overflow-x-auto pb-1`, connectors
  `h-px w-4 bg-rule-strong`, step buttons `rounded-sm border px-3 py-2 text-left
  transition-colors` — active `border-ink bg-ink text-ink-inverse`, completed
  `border-live/25 bg-live-soft hover:border-live/50`, todo `border-rule bg-slate-panel
  hover:border-rule-strong`; label `block text-xs font-semibold whitespace-nowrap tnum`,
  caption `block max-w-32 truncate text-[11px] tnum`; click navigation allows
  `i <= step` or one step ahead when unblocked.
- Steps: 0 BasicInfo · 1 Upload PDF · 2 Generate · 3 Review · 4 Model · 5 Configure ·
  6 Preview · 7 Publish (components `Assignment*Step.tsx`). Body `min-h-[60vh]`.
- Footer: `builderCardClass flex items-center justify-between gap-3 !p-4 sm:!p-5` —
  `Back` + `Save draft` (`rounded-sm border border-rule px-4 py-2 text-sm font-semibold
  text-ink-muted hover:bg-slate-sunk`), `Next` (`rounded-sm bg-ink px-4 py-2 text-sm
  font-semibold text-ink-inverse hover:opacity-90`) with blocker hint
  `hidden text-xs text-ink-faint sm:block`, `Publish` (`rounded-sm border border-live
  bg-live px-5 py-2 text-sm font-semibold text-ink-inverse hover:bg-live/88`,
  disabled until `errors.length === 0`).
- Blockers gate forward motion: step 0 title, step 1 exam board, step 2 realistic
  total marks (`isValidTotalMarks`).

### Pack builder (4 steps) — MIGRATION LEFTOVER

`PackCreate`/`PackEdit` render `PackBuilder.container.tsx`, which **still carries the
old palette**: `zinc-900`/`zinc-200`/`bg-white`/`emerald-800` classes,
`rounded-full` buttons, and a `bg-zinc-900` toast. It is the one un-migrated
screen in the app; treat its styling as debt, not precedent.

### Profile / activity / leaderboard / landing

All on the slate system: `Panel` + `PanelHeader` (`border-b border-rule px-5 py-3`),
`Segmented` toggles, `row-hover` rows in `divide-y divide-rule` lists, ink CTAs.
Leaderboard table header `grid-cols-[56px_1fr_132px_150px_120px] border-b
border-rule-strong bg-slate-ground px-4 py-2.5 text-[10px] font-semibold uppercase
tracking-[0.12em] text-ink-faint`, rows `row-hover flex flex-wrap items-center
gap-3 px-4 py-3 sm:grid sm:grid-cols-[56px_1fr_132px_150px_120px]`.
`InstructorLanding.tsx` exists as a standalone page (photo hero + pill nav era —
re-verify before editing).

### Dead code

`StatCard.tsx` (`rounded-2xl bg-white p-5 shadow-sm`, `bg-zinc-900` accent) is
unimported — delete rather than migrate.

---

## Admin app

Dev port 5175 (`base: "/admin/"`, router basename `/admin`). Tokens: ledger (above).
Fonts: Inter + Instrument Sans only (no serif).

### Layout (AdminLayout)

- Desktop rail: `fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-rule
  bg-paper-raised md:flex` — **light and bordered, not dark**. Brand block `h-14
  border-b border-rule px-4`: square `h-7 w-7 bg-ink text-[13px] font-bold
  text-paper-raised` Q + `text-[13px] font-semibold tracking-tight text-ink` QTNXT +
  `text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint` Admin.
- Nav `flex-1 overflow-y-auto p-2`: items `group relative flex items-center gap-2.5
  px-2.5 py-2 text-[13px] font-medium` — active `bg-paper-sunk text-ink` with
  `absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-ink` marker, else
  `text-ink-muted hover:bg-paper-sunk hover:text-ink`; icons `size={15}
  strokeWidth={2.2}`: Dashboard / Users / Courses / Enrollments / Payments /
  Assignments / Categories.
- Bottom user block `border-t border-rule p-2`: avatar `h-7 w-7` or `bg-ink
  text-paper-raised` initial, name `text-xs font-semibold text-ink` +
  `text-[10px] uppercase tracking-[0.12em] text-ink-faint` Administrator, logout
  `text-[13px] font-medium text-ink-muted hover:bg-paper-sunk hover:text-halt`.
- Mobile: header `sticky top-0 z-20 flex h-14 items-center justify-between border-b
  border-rule bg-paper-raised px-4 md:hidden`; nav strip `flex gap-0 overflow-x-auto
  border-b border-rule bg-paper px-3 md:hidden` with `border-b-2` underline items
  (active `border-ink text-ink`); content `px-4 py-6 sm:px-6 md:ml-56 md:py-8` →
  `mx-auto max-w-[1400px]`.

### Shared

`Panel` (`border border-rule bg-paper-raised p-5`, `flush`), `PanelHeader`
(`border-b border-rule px-5 py-3`, title `text-[11px] font-semibold uppercase
tracking-[0.14em] text-ink`), `PageHeader` (`border-b border-rule-strong pb-4`,
`text-2xl font-semibold`), `DataGrid` family, `Pagination`, `ConfirmDialog`
(focus-trap + Escape + focus restore; overlay `bg-ink/45`; panel `w-full max-w-md
border border-rule-strong bg-paper-raised p-6 shadow-[0_24px_60px_-15px_rgba(28,25,23,0.35)]`;
warning icon `h-9 w-9 shrink-0 border border-halt/30 bg-halt-soft text-halt`;
footer Cancel `Button secondary` + confirm `Button danger` — outline, not filled),
`Button` (primary `bg-ink text-paper-raised`, secondary, ghost, danger outline),
`Badge` (tones + icon; `RoleBadge` = `border-rule bg-paper-sunk text-ink-muted` with
`h-1.5 w-1.5 rounded-full` dot: admin `bg-ink`, instructor `bg-flight`, learner
`bg-live`), `Controls`, `ErrorBoundary` (full-screen recovery panel), `Protected`
role gate (non-admin → `/login` with `reason: "role"`).

### Lists

All follow `PageHeader` → `GridPanel` (toolbar = `SearchInput` + `Select`, footer =
`Pagination`) → `GridSkeleton`/`GridMessage`/`GridScroll`. Money/IDs in `₹` +
`toLocaleString("en-IN")` + `.tnum`. Search debounces 350ms with a busy ping.

- **Users:** search + role select. Columns: User (avatar or `bg-paper-sunk` icon,
  name link `max-w-[200px] truncate … hover:underline` → `/users/:id`, email),
  Mobile (`+91 …`), Role (`RoleBadge`), City, Joined (`dd MMM yy` en-IN), Actions
  ("View" link + icon-only ghost `Trash2 size={15}` delete → `ConfirmDialog`).
- **Courses:** search + status select. Columns: Course (cover `h-9 w-14` or icon,
  title link `max-w-[240px]`, category · subtitle), Instructor, Price, Students,
  Rating, Status (`Badge`), Actions (View + `Eye`/`EyeOff` publish toggle + delete).
- **Enrollments:** search + progress select. Columns: Learner (avatar + link + mobile),
  Course (link + Free/₹ subline), Instructor, Progress (`h-1.5 w-16 bg-rule/45` bar,
  fill `bg-live` at 100% else `bg-flight`, + `tnum` %), Joined, Remove (ghost
  `Trash2`, `text-halt hover:bg-halt-soft`).
- **Payments:** read-only. Columns: User, Course, Amount (`₹{amount_inr}` +
  `(amount/100).toFixed(2) {currency}` subline), Status, Order ID (`font-mono text-xs
  text-ink-muted`), Date. Empty: "Razorpay orders appear here the moment a learner
  pays for a course."
- **Assignments:** no search/filter/pagination — full list. Columns: Assignment (+
  `tnum` question count), Category (breadcrumb), Models, Duration, Status, Actions
  (publish `Check size={15} strokeWidth={2.5} text-live hover:bg-live-soft`,
  unpublish `Archive`, duplicate `Copy`, delete).
- **Categories:** three-level tree, not a table. `Panel` "New category" form
  (`Input` + `Button primary` `<Plus size={15}> Add category`); `Panel flush`
  `ul divide-y divide-rule`; rows `px-4 py-3` with `h-7 w-7` expander, name +
  `Badge` active/inactive, `tnum` counts, `Button secondary sm` Deactivate/Activate,
  icon-only delete; expanded `border-t border-rule bg-paper px-4 py-4 sm:pl-11` with
  nested "New sub-category" / "New inter-category" forms; inter-categories render as
  `inline-flex items-center gap-1 border border-rule bg-paper px-2.5 py-1 text-xs
  text-ink` chips with inline `X size={12}` delete. One `ConfirmDialog` handles all
  three levels ("and every item nested below it").

### Dashboard

`PageHeader title="Overview"`; metric rail `grid gap-px border border-rule bg-rule
sm:grid-cols-2 lg:grid-cols-4` (Revenue dominant `sm:col-span-2 text-4xl`, users,
live courses, enrollments; cells `bg-paper-raised p-5`, labels `text-[10px] uppercase
tracking-[0.12em] text-ink-faint`, values `tnum text-3xl font-semibold tracking-tight`);
`grid gap-6 lg:grid-cols-3` flush Panels: course composition (bars: Paid `bg-ink`,
Free `bg-rule-strong`, Published `bg-live`, Draft `bg-hold`), learner progress
(`bg-flight` / `bg-live`), top categories (`ol divide-y divide-rule`, `tnum` 2-digit
rank); `grid gap-6 lg:grid-cols-2`: recent users (`ul divide-y divide-rule` links,
`hover:bg-paper-sunk`) and recent enrollments (progress % `text-live`/`text-flight`).
Bars: track `h-1.5 w-full bg-rule/45` with `role="img"` aria-label, fill
`h-full transition-[width] duration-500 ease-out`.

### Detail pages

- **UserDetail** (`/users/:id`): back link `ArrowLeft`; header `border-b
  border-rule-strong pb-4` (avatar `h-14 w-14`, `text-2xl font-semibold` +
  `RoleBadge` + inactive `Badge muted`, `tnum` meta, `Button danger` "Delete user");
  `grid lg:grid-cols-5`: edit form `Panel` (zod: names, email, role enum, city,
  **age required** with `MIN_AGE`–`MAX_AGE` hint citing RAM-42, four checkbox flag
  rows `border border-rule bg-paper px-3 py-2.5` with `accent-[var(--color-ink)]`,
  Save + inline `Saved` `text-live` / `No changes made.` `text-hold` / error
  `text-halt`) + "Account info" `DefinitionList`; two `GridPanel`s: enrollments and
  payments sub-tables.
- **CourseDetail** (`/courses/:id`): back link; header `text-2xl` + status `Badge`,
  `tnum` meta `#{id} · instructor · category · level`, primary Publish/Unpublish +
  danger Delete; edit form `Panel` (Title zod required ≤200 `hasReadableTitle`,
  Subtitle, Category, Description `Textarea`, Pricing type `Select`, Price `₹`
  disabled when free + regex `^\d{0,7}(\.\d{1,2})?$`, Level, Status, Cover image URL
  validated `isImageUrl` + https, What you will learn `Textarea`, cover preview
  `h-11 w-20`); sidebar "At a glance" `DefinitionList` + "Content" `Panel` listing
  sections (`s.order.` + title + lesson count) with lessons (`Play size={11}`, title,
  `Badge` by kind: video→flight, resource→live, quiz→hold).

### Login

`flex min-h-screen flex-col bg-paper` (light page, not dark); centered `w-full
max-w-sm`; brand square `h-9 w-9 bg-ink text-sm font-bold text-paper-raised` Q +
"QTNXT Admin" + `text-[10px] uppercase tracking-[0.16em] text-ink-faint`
"Control panel"; card `mt-8 border border-rule bg-paper-raised`; header `border-b
border-rule px-6 py-4` with `h-8 w-8 border border-rule bg-paper text-ink-muted`
`Lock` box + "Admin sign in"; phone step: `+91` prefix group
(`mt-1.5 flex border border-rule bg-paper focus-within:border-ink`, input
`w-full bg-transparent px-3 py-3 text-sm placeholder:text-ink-faint focus:outline-none`,
strips non-digits, `inputMode="numeric"`, `autoComplete="tel-national"`,
placeholder "98765 43210"); OTP `tnum … text-xl tracking-[0.6em]`; buttons:
primary "Send OTP" / "Verify and sign in", ghost "Resend code" (30s cooldown),
ghost "Change number"; zod `/^[6-9]\d{9}$/` + `/^\d{4}$/`; `sendOtp` →
`POST /auth/send-otp` (toast shows `OTP sent (demo): {mock_code}`), verify →
`POST /auth/verify-otp` + `GET /users/me`; toast `aria-live="polite"` wrapper,
`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-rule-strong bg-ink
px-5 py-2.5 text-sm text-paper-raised shadow-[0_18px_40px_-12px_rgba(28,25,23,0.4)]`;
auth store key `knoova_admin_auth`; `App.tsx` purges legacy `knoova_admin_user` /
`knoova_admin_tokens`.

---

## Documents (certificate & invoice)

- **Certificate** (`CertificateView`): aubergine `room-deep` + gold, as above.
  Prints in full colour: the overlay turns static/transparent via `print:`
  variants and `.cert-sheet` forces `print-color-adjust: exact`
  (defined in `index.css`), so the dark design survives the browser's
  background stripping. Action buttons are `print:hidden`.
- **Invoice** (`frontend-learner/src/lib/invoice.ts`): standalone HTML document
  opened via `window.open`, styled in the quiet-room system (hex approximations
  of the tokens are inlined with a mapping comment) — ivory `room` canvas,
  `room-raised` sheet with `rule-strong` hairline, aubergine `room-deep`
  header with a gold rule, square `Paid` badge in `live`/`live-soft`, light
  table head, square gold print button, `Inter` + `IBM Plex Mono` loaded from
  Google Fonts, own `@media print` (`@page { margin: 12mm }`). Labeled
  "Invoice" / "Total paid" — no tax breakdown is shown, so "Tax Invoice"
  would overstate it.

## Known leftovers (migration debt, not precedent)

- `packages/shared/src/utils.ts` `LESSON_KIND_BADGE` — raw palette
  (`bg-[#3478ff]`, `bg-zinc-900`, `bg-yellow-400`, `bg-violet-600`, `bg-white`,
  `bg-emerald-500`) used in learner lesson rows.
- `packages/shared/src/utils.ts` `TIER_META` — raw zinc/amber/cyan/sky palette +
  amber gradient bar, used by both leaderboards' `TierBadge`.
- Learner text lessons carry a stale `prose-zinc` class (overrides remap to room
  tokens, so the damage is mostly theoretical).
- `CompleteProfile` logo mark renders a stale "K" letter (brand is Q).
- Razorpay hosted checkout `theme: { color: "#0f172a" }` in
  `CourseDetail.container.tsx` / `PackDetail.container.tsx` (third-party surface).
- `IBM Plex Mono` is declared as `--font-mono` in all three apps but never loaded
  from Google Fonts (the invoice document does load it); learner loads
  `Instrument Serif` but never uses it (`--font-serif` is Newsreader).
- Instructor `PackBuilder.container.tsx` (zinc/white/emerald/`rounded-full`) and
  dead `StatCard.tsx` — see instructor section.

## Rules

- `cn()` for conditionals, mobile-first `sm:`/`lg:`, no `dark:`.
- No CSS modules. `style={{ width/height }}` only for dynamic bars (progress, RR,
  revenue, heatmap levels) and certificate artwork.
- Container-Presenter: `*.container.tsx` fetches (TanStack Query), `*.tsx` pure props.
- No `rounded` on controls or containers; capsules only.
- Status never rides on colour alone — Badge pairs an icon and a word.
- `pnpm --filter frontend-learner build` / `frontend-instructor` / `frontend-admin`
  must pass.
- Testimonial photo `1490750967868` kept (CompleteProfile side panel).
