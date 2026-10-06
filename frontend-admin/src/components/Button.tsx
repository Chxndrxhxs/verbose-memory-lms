import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper-raised border-ink hover:bg-ink/88",
  secondary: "bg-paper-raised text-ink border-rule-strong hover:bg-paper-sunk",
  ghost: "bg-transparent text-ink-muted border-transparent hover:bg-paper-sunk hover:text-ink",
  danger: "bg-transparent text-halt border-halt/35 hover:bg-halt-soft",
};

/*
 * Min 32px tall so the row action buttons stay hittable, and the icon-only
 * ones widen to 32x32 to meet the same floor.
 */
const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-semibold",
        "transition-colors duration-100 ease-out select-none",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        iconOnly ? (size === "sm" ? "h-8 w-8" : "h-10 w-10") : SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}