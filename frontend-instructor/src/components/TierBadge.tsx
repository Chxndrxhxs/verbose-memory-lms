import { TIER_META } from "@masterlms/shared";

export function TierBadge({ tier, size = "sm" }: { tier: string; size?: "sm" | "md" }) {
  const meta = TIER_META[tier] ?? TIER_META.Iron;
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-black tracking-[0.14em] ring-1 ${meta.bg} ${size === "md" ? "px-3 py-1 text-[11px]" : "px-2.5 py-1 text-[10px]"}`}
    >
      <Icon size={size === "md" ? 13 : 11} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}
