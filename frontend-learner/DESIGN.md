# DESIGN.md — learner notes (subset, may lag)

> Source of truth is the root `DESIGN.md` (covers learner + instructor + admin).
> This file keeps only learner-specific reminders; for full tokens, nav, hero,
> cards, assignments, packs, profile/activity specs, read the root file.

## Learner specifics

- App served at `/` (`:5173` dev). Routes: `/`, `/courses`, `/courses/:id`,
  `/learn/:id`, `/activity`, `/leaderboard`, `/assignments`, `/packs/:id`, `/profile`, `/about`.
- Brand mark in this app is still `K` in a few places (`Login`, `CompleteProfile`,
  landing footer) — root DESIGN.md documents the `K`/`Q` variants intentionally.
- Hero image stays commented out (`// HERO` in `LandingView.tsx`); testimonial photo
  `1490750967868` is kept.
- Activity heatmap: `ActivityHeatmap.tsx` — `CELL = 22`, 26 weeks, blue-ink scale
  `[#ebf2fa → #cfe1f8 → #9bc1ec → #3b82f6 → #0f172a]`, gutter `Sun/Wed/Fri`.
- Prices in ₹ (`toLocaleString("en-IN")`); `price = 0` means `Free`.
- Container-Presenter: `src/containers/*.container.tsx` fetch (TanStack Query),
  `src/components/*.tsx` pure props. No `dark:` variants.
