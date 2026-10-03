import type { ReactNode } from "react";
import { CircleDot, Clock, PauseCircle, XCircle } from "@masterlms/shared";
import { cn } from "../lib/utils";

export type Tone = "live" | "hold" | "halt" | "flight" | "muted";

/**
 * Status is never carried by colour alone — every tone ships an icon and the
 * word itself, so it survives colour-blindness and greyscale printing.
 */
const TONE_STYLES: Record<Tone, string> = {
  live: "bg-live-soft text-live border-live/25",
  hold: "bg-hold-soft text-hold border-hold/25",
  halt: "bg-halt-soft text-halt border-halt/25",
  flight: "bg-flight-soft text-flight border-flight/25",
  muted: "bg-paper-sunk text-ink-muted border-rule",
};

const TONE_ICONS: Record<Tone, typeof CircleDot> = {
  live: CircleDot,
  hold: Clock,
  halt: XCircle,
  flight: PauseCircle,
  muted: PauseCircle,
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
  const Icon = TONE_ICONS[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        TONE_STYLES[tone],
        className,
      )}
    >
      {showIcon && <Icon size={11} strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}

/** Payment and course status come from the API as free-form strings. */
export function statusTone(status: string): Tone {
  if (status === "published" || status === "paid" || status === "active") return "live";
  if (status === "draft" || status === "pending") return "hold";
  if (status === "failed" || status === "cancelled") return "halt";
  return "muted";
}

/** Roles are identity, not state, so they read as neutral ink. */
export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-rule bg-paper-sunk px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          role === "admin" && "bg-ink",
          role === "instructor" && "bg-flight",
          role === "learner" && "bg-live",
        )}
      />
      {role}
    </span>
  );
}