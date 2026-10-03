import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * A studio panel: flat, squared, hairline-ruled. Structure comes from the
 * rule, not a shadow. Elevation is reserved for overlays.
 */
export function Panel({
  children,
  className,
  flush,
  tone = "panel",
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
  tone?: "panel" | "sunk" | "signal";
}) {
  return (
    <section
      className={cn(
        "border",
        tone === "panel" && "border-rule bg-slate-panel",
        tone === "sunk" && "border-rule bg-slate-sunk",
        tone === "signal" && "border-signal/35 bg-signal-wash",
        !flush && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Card header: eyebrow + title + one line of context. Three levels, no more. */
export function PanelHeader({
  title,
  subtitle,
  meta,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta}
        {action}
      </div>
    </header>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Page heading. Title, one line of context, optional action. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong pb-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/**
 * Page shell. The site header is sticky, so it holds its own space in the
 * flow and pages need no manual top offset.
 */
export function PageShell({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-ground">
      <div
        className={cn(
          "mx-auto w-full px-4 pb-10 pt-6 sm:px-6 sm:pt-8",
          wide ? "max-w-[1600px]" : "max-w-[1200px]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Section break that respects the 1-4-9 rhythm. */
const STACK_GAP: Record<4 | 5 | 6 | 8, string> = {
  4: "space-y-4",
  5: "space-y-5",
  6: "space-y-6",
  8: "space-y-8",
};

export function Stack({ children, gap = 6 }: { children: ReactNode; gap?: 4 | 5 | 6 | 8 }) {
  return <div className={STACK_GAP[gap]}>{children}</div>;
}