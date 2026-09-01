# DESIGN.md — Knoova (MasterLMS Learner)

Source of truth for learner app aesthetics. Agents must follow this before writing UI. Stack: React + Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite`).

## Brand
- **Name:** Knoova · Mark: `K` in `bg-[#0f172a]` circle
- **Vibe:** calm, focused, human — soft neutrals + saturated pills on warm `#f6f5f1` canvas. Not corporate, not brutalist.
- **Logo usage:** `h-7 w-7 rounded-full bg-[#0f172a] text-xs font-bold text-white` + wordmark `text-sm font-bold tracking-tight`

## Colors
- **Canvas:** `bg-[#f6f5f1]` (warm stone, all pages)
- **Text:** `text-zinc-900` primary, `text-zinc-600` body, `text-zinc-500` mute, `text-zinc-400` watermark
- **Ink:** `bg-[#0f172a]` primary CTA / price deep navy
- **Primary blue:** `bg-[#3478ff]` / `text-white` — pills, CTAs, featured cards
- **Yellow:** `bg-yellow-400 text-zinc-900` — highlights, marker sweep, calor tags
- **Emerald:** `bg-emerald-500 / bg-emerald-600 text-white` — success, ✓ badges
- **Borders:** `border-zinc-200`, card border `border`, pill border `border border-zinc-200` on white pills
- **Overlays:** hero `from-black/55 via-black/10 to-black/10` + `from-[#3478ff]/20 to-amber-200/20 mix-blend-overlay`

## Typography
- **Imports:** `Inter 300-900`, `Instrument Sans 500-700`, `Instrument Serif 400 italic`, `Newsreader 300-500` (see `frontend-learner/index.html`)
- **Tokens in `src/index.css`:** `--font-sans: Inter`, `--font-display: Instrument Sans`, `--font-serif: Instrument Serif`, `--font-news: Newsreader`
- **Hero stack (centered, `tracking-[-0.04em]`):**
  - L1 `Learn skills that` → `font-news font-light 30px sm:46px`
  - L2 `actually` → `font-serif italic 36px sm:56px` with yellow marker `absolute h-[10px] sm:h-[14px] bg-yellow-400 -rotate-1`
  - L3 `move you forward.` → `font-sans font-black 32px sm:50px tracking-[-0.05em]`
  - Subhead → `font-light text-[12px] sm:text-[13px] tracking-wide text-white/80` with `•` as `font-semibold text-white`
- **Headings:** `text-2xl sm:text-3xl font-bold tracking-tight` (Instrument Sans), FAQ/statement `text-[26px] sm:text-[36px] font-extrabold`
- **Body:** `text-xs sm:text-sm leading-relaxed`, card meta `text-[10px] font-semibold text-zinc-500`, card title `text-sm font-bold leading-tight`

## Spacing & Radius
- **Outer gutters:** `px-3 sm:px-4` (all sections full-width, hero `px-3 pt-3 sm:px-4`). Never `mx-auto max-w-6xl` with inner `px-6` alone.
- **Section vertical:** Trusted `py-10 sm:py-12`, Explore `pb-10 sm:pb-12`, Marquee `py-8 sm:py-10`, Statement `py-10 sm:py-12` inner `py-16 sm:py-20 lg:py-24`, Features `py-6 sm:py-8 gap-5`, Testimonial `pt-10 sm:pt-12 h-[480px] sm:h-[520px]`, FAQ `py-14 sm:py-20`, CTA `py-6 sm:py-8` inner `py-20 sm:py-24 lg:py-28`
- **Radius:** Hero/Cards outer `rounded-[28px]`, course cards `rounded-2xl`, pills `rounded-full`, enroll card `rounded-[20px]`
- **Shadows:** nav pill `shadow-lg`, cards `shadow-sm`, featured `shadow-lg`, testimonial `shadow-xl`, enroll sticky `shadow-sm`

## Components

### Pill Nav (Header + TopNav must match)
- **Header (landing):** `absolute left-1/2 top-4 w-[92%] max-w-[720px] -translate-x-1/2 flex rounded-full bg-white px-2 py-2 shadow-lg sm:px-3`
- **TopNav (inner pages):** `sticky top-0 flex justify-center px-3 pt-7 sm:px-4` + inner `w-[92%] max-w-[720px] flex rounded-full bg-white px-2 py-2 shadow-lg sm:px-3` — 28px top inset matches Header's `pt-3 + top-4`
- Nav links `ml-4 hidden gap-4 text-sm font-medium text-zinc-600`, active `text-zinc-900`

### Hero
- `h-[620px] sm:h-[700px] lg:h-[760px] overflow-hidden rounded-[28px]`
- Floating deco cards `hidden lg:flex -rotate-3 / rotate-2 rounded-2xl bg-white p-3 shadow-xl` at `left-6 top-[38%]` / `right-6 top-[42%]`
- Centered copy `absolute inset-0 flex justify-center pt-12 text-center` + eyebrow pill `bg-white/15 backdrop-blur-md border border-white/20`

### Pills / Marquee
- Pill: `inline-flex h-7 shrink-0 gap-1.5 rounded-full px-3.5 text-xs font-semibold leading-none` + color variant
- Marquee: `overflow-hidden` + `w-max animate-[marquee_28s_linear_infinite]` / `marquee-reverse_30s`, duplicate sequence for seamless loop (`@keyframes marquee` in `index.css`)

### Course Cards
- `rounded-2xl border bg-white p-3 shadow-sm`, meta `text-[10px]`, media `h-36 rounded-xl overflow-hidden mix-blend-overlay`, featured `scale-[1.03] -rotate-[1deg] shadow-lg`
- Presenters: `src/components/CourseCard.tsx`, `src/components/LandingView.tsx` — containers never fetch

### Statement / Features / Testimonial / FAQ / CTA
- Statement inner: `rounded-[28px] bg-white px-6 py-16 sm:px-10 sm:py-20` with absolute Pills `Calm`/`Motivated`/`Focused sessions`
- Features: `grid gap-5 sm:grid-cols-2 lg:grid-cols-4`, card `rounded-2xl bg-white p-6 sm:p-7`, icon `h-8 w-8 rounded-full bg-zinc-900 text-white`
- Testimonial: `relative w-full overflow-hidden rounded-[28px] h-[480px] sm:h-[520px]` + bottom card `absolute -translate-x-1/2 w-[92%] max-w-[520px] rounded-2xl bg-white p-5 shadow-xl`
- FAQ: `max-w-3xl` centered, item `rounded-2xl bg-white px-5 py-4 shadow-sm`, toggle `h-6 w-6 rounded-full bg-[#3478ff] text-white / bg-zinc-100`
- Final CTA: `rounded-[28px] bg-[#0f172a] py-20 sm:py-24 text-white`

### Course Detail (Udemy pattern, soft)
- Grid `lg:grid-cols-[1fr_360px] gap-6`, left: Bestseller pill `bg-[#3478ff]`, What you'll learn `bg-[#fdfdfc] border p-5 grid sm:grid-cols-2` with `✓ bg-emerald-500`, Curriculum `rounded-2xl border` accordion `bg-zinc-50` header
- Right sticky `top-[88px] rounded-[20px] border bg-white` with preview `h-44`, price `text-[28px] font-black` + yellow `50% off`

## Rules
- Use `cn()` for conditionals, mobile-first `sm:`/`lg:`, `dark:` not needed.
- No CSS modules, no `style` objects. Follow tokens above — no arbitrary `w-[347px]`.
- Keep Container-Presenter: `*.container.tsx` fetches (TanStack Query), `*.tsx` presenters pure props.
- `pnpm --filter frontend-learner build` must pass. Hero image unsplash `1507525428034`, testimonial `1490750967868`.
