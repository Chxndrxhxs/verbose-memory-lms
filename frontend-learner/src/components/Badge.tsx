import type { ReactNode } from "react";
import { CircleDot, Clock, PauseCircle, XCircle, Star, Check } from "@masterlms/shared";
import { cn } from "../lib/utils";

export type Tone = "live" | "hold" | "halt" | "flight" | "muted" | "gold";

/** Status never rides on colour alone: every tone ships an icon and the word. */
const TONE: Record<Tone, { cls: string; Icon: typeof CircleDot }> = {
  live: { cls: "border-live/25 bg-live-soft text-live", Icon: Check },
  hold: { cls: "border-hold/30 bg-hold-soft text-hold", Icon: Clock },
  halt: { cls: "border-halt/25 bg-halt-soft text-halt", Icon: XCircle },
  flight: { cls: "border-flight/25 bg-flight-soft text-flight", Icon: PauseCircle },
  muted: { cls: "border-rule bg-room-sunk text-ink-muted", Icon: CircleDot },
  gold: { cls: "border-gold-deep/35 bg-gold-wash text-gold-deep", Icon: Star },
};

export function Badge({
  tone,
  children,
  showIcon = true,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  showIcon?: boolean;
  className?: string;
}) {
  const { cls, Icon } = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        cls,
        className,
      )}
    >
      {showIcon && <Icon size={11} strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "published":
    case "paid":
    case "active":
    case "completed":
    case "passed":
      return "live";
    case "draft":
    case "pending":
    case "in_progress":
      return "hold";
    case "failed":
    case "cancelled":
      return "halt";
    default:
      return "muted";
  }
}

/** Progress bar. Marigold means "your place in the course". */
export function Progress({
  value,
  max = 100,
  label,
  className,
  tone = "gold",
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  tone?: "gold" | "live" | "ink";
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const fill = tone === "gold" ? "bg-gold" : tone === "live" ? "bg-live" : "bg-ink";
  return (
    <div
      className={cn("h-1.5 w-full bg-rule/50", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div
        className={cn("h-full transition-[width] duration-500 ease-out", fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}