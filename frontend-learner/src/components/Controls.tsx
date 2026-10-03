import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Search } from "@masterlms/shared";
import { cn } from "../lib/utils";

/*
 * Labels are always rendered and always associated. Placeholders show
 * examples, never substitute for a label.
 */

const CONTROL =
  "w-full border border-rule bg-room-raised px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-faint transition-colors duration-100 focus:border-ink";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-ink-muted">
        {label}
        {required && (
          <span className="ml-1 text-halt" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-halt">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        CONTROL,
        "appearance-none bg-[length:10px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b6069' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  busy,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  busy?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("relative min-w-[220px] flex-1", className)}>
      <Search
        size={15}
        strokeWidth={2.5}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(CONTROL, "pl-9", busy && "pr-9")}
      />
      {busy && (
        <span
          aria-hidden
          className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 animate-ping rounded-full bg-ink-faint"
        />
      )}
    </div>
  );
}

export function DefinitionList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5">
      {items.map(([k, v]) => (
        <div key={k} className="border-b border-rule pb-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {k}
          </dt>
          <dd className="mt-1 truncate text-sm font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Callout. Never colour alone: always words, and an icon where it matters. */
export function Notice({
  tone,
  title,
  role,
  children,
}: {
  tone: "info" | "warn" | "error" | "live" | "gold";
  title?: string;
  role?: "status" | "alert";
  children: ReactNode;
}) {
  const map = {
    info: "border-flight/25 bg-flight-soft text-flight",
    warn: "border-hold/30 bg-hold-soft text-hold",
    error: "border-halt/25 bg-halt-soft text-halt",
    live: "border-live/25 bg-live-soft text-live",
    gold: "border-gold-deep/30 bg-gold-wash text-gold-deep",
  } as const;
  return (
    <div role={role} className={cn("border px-4 py-3 text-sm leading-relaxed", map[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && "mt-1")}>{children}</div>
    </div>
  );
}