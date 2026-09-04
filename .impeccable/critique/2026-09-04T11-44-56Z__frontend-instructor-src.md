---
target: instructor frontend
total_score: 14
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\harichandana\\Desktop\\ramanasoft\\masterlms\\frontend-instructor\\src"
timestamp: 2026-09-04T11-44-56Z
slug: frontend-instructor-src
---
# Critique — frontend-instructor/src (14/32, Poor)

Method: A sub-agent (design review) · B inline (detector CLI + browser overlay on public routes)

## Health scores
H1 visibility 2 · H2 real-world 2 · H3 control 1 · H4 consistency 2 · H5 prevention 1 · H6 recognition 2 · H7 n/a · H8 aesthetics 3 · H9 recovery 1 · H10 n/a. Total 14/32.

## Specificity
Authored surface (canvas, ink pills, Teach marker, landing hero), generic body. Landing claims ₹2,840/1,204 students vs Dashboard hardcode ₹8,420/12,438 — product contradicts itself.

## Detector (CLI, exit 0, 13 warnings)
Real: gradient text CourseCreateStep1.tsx:71; contrast Analytics.tsx:11 (zinc-400 on emerald). False positives: 11× zinc-900 on yellow-400 (fine contrast).

## Browser overlay (landing + login, desktop)
Injection succeeded (`+detect-loaded`). Flags: Teach pill (FP), white-on-photo hero copy (gradient-dependent, monitor), 2× `text-zinc-400` helper lines on login (real, ~2.8:1). Authenticated routes not inspectable (OTP wall).

## Priority issues
- [P1] Pricing labels inverted + unvalidated (CourseCreateStep1.tsx:142-171) → clarify
- [P1] Destructive deletes unguarded (ChapterSection) → harden
- [P1] Publish blind fire, no checklist → harden
- [P2] Fake AI buttons → "coming soon" toast → distill
- [P2] Hardcoded fantasy data on Dashboard/Analytics → harden

## Personas
Alex: no search/command-K, no bulk ops, fake drag-reorder tip, no autosave. Jordan: ambiguous dot-split rule, AI-vs-manual with no guidance, unexplained PG-fee checkbox, 4px quiz radio. Casey: Publish hidden on mobile (`hidden sm:inline-flex`) — phone users cannot publish; cramped builder pill; 2.5s toasts.

## Minor
ASCII StatCard icons; emoji hover-only ProfileMenu; K-vs-Q mark; wrong-role Skip link; no Analytics ranges/axes; no cover dimension guidance.

## Questions
Take-home pay at price time? Preview-as-default builder? Which screen to delete for sub-10-min first publish?
