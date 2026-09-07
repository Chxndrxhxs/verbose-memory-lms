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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-zinc-500">
        {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-sm disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <span className="px-3 text-xs font-semibold text-zinc-600">
          Page {page} of {Math.max(pages, 1)}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className={cn("flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-sm disabled:opacity-40")}
          aria-label="Next page"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}