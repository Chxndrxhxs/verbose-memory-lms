import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { Panel } from "./Panel";

export function ListPanel({
  toolbar,
  children,
  footer,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Panel flush className={cn("overflow-hidden", className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-room px-4 py-3">
          {toolbar}
        </div>
      )}
      {children}
      {footer && <div className="border-t border-rule bg-room px-4 py-2.5">{footer}</div>}
    </Panel>
  );
}

/** Empty and error are taught states: what belongs here, and what to do next. */
export function ListMessage({
  kind,
  title,
  body,
  action,
}: {
  kind: "empty" | "error";
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const isError = kind === "error";
  const Icon = isError ? AlertCircle : Inbox;
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center border",
          isError
            ? "border-halt/30 bg-halt-soft text-halt"
            : "border-rule bg-room-sunk text-ink-faint",
        )}
      >
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-ink-faint">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn("divide-y divide-rule", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-12 w-16 shrink-0 animate-pulse bg-room-sunk" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-40 animate-pulse bg-room-sunk" />
            <div className="mt-2 h-2.5 w-24 animate-pulse bg-room-sunk" />
          </div>
          <div className="h-3 w-14 shrink-0 animate-pulse bg-room-sunk" />
        </li>
      ))}
    </ul>
  );
}

/** The one pagination pattern, replacing the three that coexisted. */
export function Pager({
  page,
  pages,
  total,
  onChange,
  noun = "result",
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (p: number) => void;
  noun?: string;
}) {
  if (pages <= 1 && total === 0) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="tnum text-xs text-ink-muted">
        {total.toLocaleString("en-IN")} {total === 1 ? noun : `${noun}s`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="h-8 border border-rule px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-room-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Previous
        </button>
        <span className="tnum px-2 text-xs font-medium text-ink-muted">
          {page} / {Math.max(pages, 1)}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="h-8 border border-rule px-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-room-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}