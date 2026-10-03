import { TIER_META } from "@masterlms/shared";
import { cn } from "../lib/utils";

/*
 * Tier colour comes from TIER_META so the leaderboard, profile and any future
 * surface agree. The one exception is Gold, which uses the app's signal yellow
 * because it is genuinely the top mark — that is the one place signal earns
 * its keep outside the instructor's own identity.
 */
export function TierBadge({ tier, size = "sm" }: { tier: string; size?: "sm" | "md" }) {
  const meta = TIER_META[tier] ?? TIER_META.Iron;
  const Icon = meta.Icon;
  const isGold = tier === "Gold";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-semibold uppercase tracking-[0.1em]",
        size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]",
        isGold
          ? "border-signal-deep/40 bg-signal-wash text-signal-deep"
          : "border-rule bg-slate-sunk text-ink-muted",
      )}
    >
      <Icon size={size === "md" ? 13 : 11} strokeWidth={2.5} aria-hidden />
      {tier}
    </span>
  );
}