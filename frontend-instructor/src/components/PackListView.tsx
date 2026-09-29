import { useMemo, useState } from "react";
import { Plus } from "@masterlms/shared";
import type { PackListItem } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { formatPackPrice } from "../types/pack";

type Props = {
  packs: PackListItem[];
  isLoading: boolean;
  error: Error | null;
  toast: string | null;
  confirmDelete: number | null;
  onNew: () => void;
  onEdit: (id: number) => void;
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onAskDelete: (id: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  busy: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-zinc-200 text-zinc-600",
};

const darkButton =
  "inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] " +
  "text-white hover:bg-black";
const cardButton =
  "rounded-full border border-zinc-200 px-3.5 py-1.5 hover:bg-zinc-50 " +
  "disabled:opacity-50";
const toastClass =
  "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 " +
  "px-5 py-2.5 text-sm text-white shadow-xl";

function categoryLabel(pack: PackListItem): string | null {
  const chain = pack.inter_category;
  if (!chain) return null;
  return `${chain.category.name} / ${chain.sub_category.name} / ${chain.name}`;
}

export function PackListView({
  packs,
  isLoading,
  error,
  toast,
  confirmDelete,
  onNew,
  onEdit,
  onPublish,
  onUnpublish,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  busy,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packs.filter((pack) => {
      if (statusFilter && pack.status !== statusFilter) return false;
      if (!q) return true;
      return (
        pack.title.toLowerCase().includes(q) ||
        (pack.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [packs, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Question packs</h1>
          <p className="text-sm text-zinc-500">
            Bundle saved questions into packs learners can buy.{" "}
            <span className="font-semibold text-zinc-700">
              {packs.filter((p) => p.status === "published").length} live
            </span>
          </p>
        </div>
        <button
          onClick={onNew}
          className={`${darkButton} px-4 py-2 text-sm font-semibold`}
        >
          <Plus size={14} /> New pack
        </button>
      </div>

      {packs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packs…"
            className={cn(
              "min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white",
              "px-3.5 py-2 text-sm outline-none focus:border-zinc-900",
            )}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "rounded-xl border border-zinc-200 bg-white px-3 py-2",
              "text-sm outline-none focus:border-zinc-900",
            )}
            title="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading packs…</p>}
      {error && (
        <p className="mt-6 text-sm text-red-600">Couldn&apos;t load packs: {error.message}</p>
      )}
      {!isLoading && !error && packs.length === 0 && (
        <div
          className={cn(
            "mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white",
            "p-10 text-center",
          )}
        >
          <p className="text-sm font-semibold">No packs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
            Packs are built from questions you already saved in assignments. Create an
            assignment first, then bundle its questions here.
          </p>
          <button
            onClick={onNew}
            className={`${darkButton} mt-4 px-4 py-2 text-xs font-semibold`}
          >
            <Plus size={13} /> Create your first pack
          </button>
        </div>
      )}

      {!isLoading && !error && packs.length > 0 && visible.length === 0 && (
        <p
          className={cn(
            "mt-6 rounded-2xl border border-dashed border-zinc-300 p-8",
            "text-center text-xs text-zinc-500",
          )}
        >
          No packs match your filters.
        </p>
      )}

      <div className="mt-4 grid gap-3">
        {visible.map((pack) => (
          <div
            key={pack.id}
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-2xl border",
              "border-zinc-200 bg-white p-4",
            )}
          >
            {pack.cover ? (
              <img
                src={pack.cover}
                alt=""
                className="h-16 w-12 shrink-0 rounded-lg border border-zinc-200 object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex h-16 w-12 shrink-0 items-center justify-center rounded-lg",
                  "bg-zinc-100 text-[10px] font-bold text-zinc-400",
                )}
              >
                No cover
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <button
                  onClick={() => onEdit(pack.id)}
                  className="truncate hover:underline"
                >
                  {pack.title}
                </button>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_STYLES[pack.status] ?? "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {pack.status}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {pack.question_count} question{pack.question_count === 1 ? "" : "s"} ·{" "}
                {formatPackPrice(pack.price)}
                {pack.max_attempts > 0 && ` · ${pack.max_attempts} attempts`} ·{" "}
                {(pack.allowed_modules ?? []).join(", ") || "no formats"}
              </p>
              {categoryLabel(pack) && (
                <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                  {categoryLabel(pack)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button onClick={() => onEdit(pack.id)} className={cardButton}>
                Edit
              </button>
              {pack.status === "published" ? (
                <button
                  onClick={() => onUnpublish(pack.id)}
                  disabled={busy}
                  className={cardButton}
                >
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={() => onPublish(pack.id)}
                  disabled={busy}
                  className={cn(
                    "rounded-full bg-emerald-600 px-3.5 py-1.5 text-white",
                    "hover:bg-emerald-700 disabled:opacity-50",
                  )}
                >
                  Publish
                </button>
              )}
              <button
                onClick={() => onAskDelete(pack.id)}
                disabled={busy}
                className={cn(
                  "rounded-full border border-red-200 px-3.5 py-1.5 text-red-600",
                  "hover:bg-red-50 disabled:opacity-50",
                )}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold">Delete this pack?</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Learners who bought it keep their history, but it leaves the store.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onCancelDelete}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold text-zinc-600",
                  "hover:text-zinc-900",
                )}
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={busy}
                className={cn(
                  "rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white",
                  "hover:bg-red-700 disabled:opacity-50",
                )}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={toastClass}>
          {toast}
        </div>
      )}
    </div>
  );
}
