import type { ReactNode } from "react";
import { CircleDot, Clock, PauseCircle, XCircle } from "@masterlms/shared";
import { cn } from "../lib/utils";

export type Tone = "live" | "hold" | "halt" | "flight" | "muted" | "signal";

/**
 * Status never rides on colour alone. Every tone ships an icon and the word,
 * so it survives colour-blindness and greyscale printing.
 */
const TONE: Record<Tone, { cls: string; Icon: typeof CircleDot }> = {
  live: { cls: "border-live/25 bg-live-soft text-live", Icon: CircleDot },
  hold: { cls: "border-hold/30 bg-hold-soft text-hold", Icon: Clock },
  halt: { cls: "border-halt/25 bg-halt-soft text-halt", Icon: XCircle },
  flight: { cls: "border-flight/25 bg-flight-soft text-flight", Icon: PauseCircle },
  muted: { cls: "border-rule bg-slate-sunk text-ink-muted", Icon: PauseCircle },
  signal: { cls: "border-signal-deep/35 bg-signal-wash text-signal-deep", Icon: CircleDot },
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
    case "correct":
      return "live";
    case "draft":
    case "pending":
    case "needs_review":
      return "hold";
    case "failed":
    case "cancelled":
    case "inactive":
      return "halt";
    default:
      return "muted";
  }
}

/**
 * The Teach mark. Signal yellow appears nowhere else as decoration — this is
 * the instructor's own identity, so it is the one place it lives.
 */
export function TeachMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-signal-deep/40 bg-signal px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-[0.12em] text-ink",
        className,
      )}
    >
      Teach
    </span>
  );
}