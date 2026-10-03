import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { Panel } from "./Panel";

/*
 * The data grid is the spine of the product. It owns the loading, error and
 * empty states so no list view invents its own, and it never nests a card
 * inside a card.
 */

export function GridPanel({
  toolbar,
  children,
  footer,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Panel flush className="overflow-hidden">
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-paper px-4 py-3">
          {toolbar}
        </div>
      )}
      {children}
      {footer && (
        <div className="border-t border-rule bg-paper px-4 py-2.5">{footer}</div>
      )}
    </Panel>
  );
}

export function GridScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function GridHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-rule-strong bg-paper">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={cn("grid-row border-b border-rule last:border-0", className)}>{children}</tr>;
}

export function Td({
  children,
  align = "left",
  className,
  ...rest
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
} & React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 align-middle", align === "right" ? "text-right" : "text-left", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Loading rows mirror the real column rhythm so the table doesn't jump. */
export function GridSkeleton({ rows = 6, cells = 5 }: { rows?: number; cells?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-rule last:border-0">
          {Array.from({ length: cells }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <div
                className={cn("h-3 animate-pulse bg-paper-sunk", c === 0 ? "w-32" : "w-14")}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Empty and error are taught states, not apologies: they say what belongs
 * here and where to go next.
 */
export function GridMessage({
  kind,
  title,
  body,
}: {
  kind: "empty" | "error";
  title: string;
  body: string;
}) {
  const isError = kind === "error";
  const Icon = isError ? AlertCircle : Inbox;
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Icon
        size={20}
        strokeWidth={2}
        aria-hidden
        className={isError ? "text-halt" : "text-ink-faint"}
      />
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-ink-faint">{body}</p>
    </div>
  );
}