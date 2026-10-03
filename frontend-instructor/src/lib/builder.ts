/*
 * Builder surfaces (course, assignment, pack) all share these. The old values
 * were hardcoded per file, which is how the app ended up with six card shapes
 * and three pagination patterns.
 */

export const builderPageClass =
  "mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8";

export const builderCardClass =
  "border border-rule bg-slate-panel p-5 sm:p-6";

export const builderFieldClass =
  "w-full border border-rule bg-slate-panel px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-faint transition-colors duration-100 focus:border-ink";

export const builderLabelClass =
  "block text-xs font-semibold text-ink-muted";

export const builderHintClass =
  "mt-1.5 text-xs leading-relaxed text-ink-faint";

export const builderSectionTitleClass =
  "text-base font-semibold text-ink";

export const builderEyebrowClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint";