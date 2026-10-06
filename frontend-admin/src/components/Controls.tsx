import { useId, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Search } from "@masterlms/shared";
import { cn } from "../lib/utils";

/*
 * Labels are always rendered. Placeholder is only ever an example, and the
 * focus state is the app-wide :focus-visible ring plus a border change, so
 * keyboard users get two signals instead of one.
 */

const CONTROL =
  "w-full border bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint " +
  "transition-colors duration-100 focus:border-ink";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-xs font-semibold text-ink-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-halt">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "resize-y", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        CONTROL,
        "appearance-none bg-[length:10px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23706a5f' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Search input with a leading glyph. Labelled by the surrounding toolbar. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  busy?: boolean;
}) {
  const id = useId();
  return (
    <div className="relative min-w-[200px] flex-1">
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

/** Two-column key/value ledger used in detail panels. */
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