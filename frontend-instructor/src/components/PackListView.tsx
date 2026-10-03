import { useMemo, useState } from "react";
import { Plus } from "@masterlms/shared";
import type { PackListItem } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { Modal } from "./Modal";
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
  draft: "border-hold/30 bg-hold-soft text-hold",
  published: "border-live/25 bg-live-soft text-live",
  archived: "border-rule bg-slate-sunk text-ink-muted",
};

const darkButton =
  "inline-flex items-center gap-2 rounded-sm bg-ink " +
  "text-ink-inverse hover:opacity-90";
const cardButton =
  "rounded-sm border border-rule px-3 py-1.5 text-ink-muted hover:bg-slate-sunk " +
  "disabled:opacity-50";
const toastClass =
  "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-sm border border-rule-strong " +
  "bg-ink px-5 py-2 text-sm text-ink-inverse shadow-lg";

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
          <h1 className="text-2xl font-semibold text-ink">Question packs</h1>
          <p className="text-sm text-ink-muted tnum">
            Bundle saved questions into packs learners can buy.{" "}
            <span className="font-semibold text-ink">
              {packs.filter((p) => p.status === "published").length} live
            </span>
          </p>
        </div>
        <button
          type="button"
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
              "min-w-0 flex-1 rounded-sm border border-rule bg-slate-panel",
              "px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink",
            )}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "rounded-sm border border-rule bg-slate-panel px-3 py-2",
              "text-sm text-ink focus:border-ink",
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

      {isLoading && <p className="mt-6 text-sm text-ink-muted">Loading packs…</p>}
      {error && (
        <p className="mt-6 text-sm text-halt">Couldn&apos;t load packs: {error.message}</p>
      )}
      {!isLoading && !error && packs.length === 0 && (
        <div
          className={cn(
            "mt-6 border border-dashed border-rule-strong bg-slate-panel",
            "p-10 text-center",
          )}
        >
          <p className="text-sm font-semibold text-ink">No packs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Packs are built from questions you already saved in assignments. Create an
            assignment first, then bundle its questions here.
          </p>
          <button
            type="button"
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
            "mt-6 border border-dashed border-rule-strong p-8",
            "text-center text-xs text-ink-muted",
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
              "flex flex-wrap items-center gap-4",
              "border border-rule bg-slate-panel p-4",
            )}
          >
            {pack.cover ? (
              <img
                src={pack.cover}
                alt=""
                className="h-16 w-12 shrink-0 border border-rule object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex h-16 w-12 shrink-0 items-center justify-center border border-rule",
                  "bg-slate-sunk text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint",
                )}
              >
                No cover
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                <button
                  type="button"
                  onClick={() => onEdit(pack.id)}
                  className="truncate hover:underline"
                >
                  {pack.title}
                </button>
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    STATUS_STYLES[pack.status] ?? "border-rule bg-slate-sunk text-ink-muted",
                  )}
                >
                  {pack.status}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-muted tnum">
                {pack.question_count} question{pack.question_count === 1 ? "" : "s"} ·{" "}
                {formatPackPrice(pack.price)}
                {pack.max_attempts > 0 && ` · ${pack.max_attempts} attempts`} ·{" "}
                {(pack.allowed_modules ?? []).join(", ") || "no formats"}
              </p>
              {categoryLabel(pack) && (
                <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                  {categoryLabel(pack)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button type="button" onClick={() => onEdit(pack.id)} className={cardButton}>
                Edit
              </button>
              {pack.status === "published" ? (
                <button
                  type="button"
                  onClick={() => onUnpublish(pack.id)}
                  disabled={busy}
                  className={cardButton}
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPublish(pack.id)}
                  disabled={busy}
                  className={cn(
                    "rounded-sm border border-live bg-live px-3 py-1.5 text-ink-inverse",
                    "hover:bg-live/88 disabled:opacity-50",
                  )}
                >
                  Publish
                </button>
              )}
              <button
                type="button"
                onClick={() => onAskDelete(pack.id)}
                disabled={busy}
                className={cn(
                  "rounded-sm border border-halt/35 px-3 py-1.5 text-halt",
                  "hover:bg-halt-soft disabled:opacity-50",
                )}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={confirmDelete != null}
        onClose={onCancelDelete}
        title="Delete this pack?"
        description="Learners who bought it keep their history, but it leaves the store."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelDelete}
              className="rounded-sm px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={busy}
              className="rounded-sm border border-halt bg-halt px-4 py-2 text-sm font-semibold text-ink-inverse hover:bg-halt/88 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          This removes the pack from the store straight away. It can&apos;t be undone.
        </p>
      </Modal>

      {toast && (
        <div className={toastClass}>
          {toast}
        </div>
      )}
    </div>
  );
}
