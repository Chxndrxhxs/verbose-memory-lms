import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * A ledger panel: flat, hairline-ruled, no elevation. Structure comes from
 * the rule, never from a shadow. Depth is reserved for overlays.
 */
export function Panel({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "border border-rule bg-paper-raised",
        flush ? "" : "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
          {title}
        </h2>
        {meta && <span className="truncate text-xs text-ink-faint">{meta}</span>}
      </div>
      {action}
    </header>
  );
}

/** Page-level heading: title, one line of context, nothing else. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong pb-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}