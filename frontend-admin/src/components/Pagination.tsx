import { ChevronLeft, ChevronRight } from "@masterlms/shared";
import { cn } from "../lib/utils";

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1 && total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="tnum text-xs text-ink-muted">
        {total.toLocaleString("en-IN")} {total === 1 ? "result" : "results"}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center border border-rule text-ink-muted transition-colors hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft size={15} strokeWidth={2.5} aria-hidden />
        </button>
        <span className="tnum px-2 text-xs font-medium text-ink-muted">
          Page {page} of {Math.max(pages, 1)}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className={cn(
            "flex h-8 w-8 items-center justify-center border border-rule text-ink-muted transition-colors",
            "hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <ChevronRight size={15} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </nav>
  );
}