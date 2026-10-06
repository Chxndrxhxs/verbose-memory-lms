import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * Flat, squared, hairline-ruled. Structure comes from the rule; elevation is
 * reserved for overlays.
 */
export function Panel({
  children,
  className,
  flush,
  tone = "raised",
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
  tone?: "raised" | "sunk" | "ink" | "gold";
}) {
  return (
    <section
      className={cn(
        "border",
        tone === "raised" && "border-rule bg-room-raised",
        tone === "sunk" && "border-rule bg-room-sunk",
        tone === "ink" && "border-ink bg-room-deep text-ink-inverse",
        tone === "gold" && "border-gold-deep/35 bg-gold-wash",
        !flush && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

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

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-rule-strong pb-4",
        className,
      )}
    >
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
 * Page shell. The site header is sticky and holds its own space in the flow,
 * so no page needs a manual top offset.
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
    <div className="min-h-screen bg-room">
      <div
        className={cn(
          "mx-auto w-full px-4 pb-12 pt-6 sm:px-6 sm:pt-8",
          wide ? "max-w-[1560px]" : "max-w-[1200px]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

const STACK_GAP: Record<4 | 5 | 6 | 8, string> = {
  4: "space-y-4",
  5: "space-y-5",
  6: "space-y-6",
  8: "space-y-8",
};

export function Stack({ children, gap = 6 }: { children: ReactNode; gap?: 4 | 5 | 6 | 8 }) {
  return <div className={STACK_GAP[gap]}>{children}</div>;
}