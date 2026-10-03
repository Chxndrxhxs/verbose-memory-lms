import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "live" | "gold";
type Size = "sm" | "md" | "lg";

/*
 * One family. The old app had a dozen rounded-full treatments and two
 * competing primaries (bg-[#0f172a] and #3478ff).
 *
 * Gold is NOT the default CTA. Spending the one accent on "Enroll" would
 * leave nothing for progress, which is what gold is actually for.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-ink-inverse border-ink hover:bg-ink/88",
  secondary: "bg-room-raised text-ink border-rule-strong hover:bg-room-sunk",
  ghost: "bg-transparent text-ink-muted border-transparent hover:bg-room-sunk hover:text-ink",
  danger: "bg-transparent text-halt border-halt/35 hover:bg-halt-soft",
  live: "bg-live text-ink-inverse border-live hover:bg-live/88",
  gold: "bg-gold text-ink border-gold-deep hover:bg-gold/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  block = false,
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-semibold select-none",
        "transition-colors duration-100 ease-out",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        iconOnly ? (size === "sm" ? "h-8 w-8" : "h-10 w-10") : SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The one segmented control, with a real selected state for assistive tech. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 border border-rule bg-room-sunk p-0.5",
        size === "sm" ? "text-xs" : "text-sm",
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center font-semibold transition-colors duration-100",
              size === "sm" ? "h-7 px-2.5" : "h-8 px-3",
              selected
                ? "bg-room-raised text-ink shadow-[0_1px_2px_rgba(35,20,40,0.07)]"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}