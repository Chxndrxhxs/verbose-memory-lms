import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Clock,
  HelpCircle,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { Modal } from "./Modal";
import type { Assignment, AssignmentStatus } from "../types/assignment";
import {
  MODEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  getTotalQuestions,
} from "../types/assignment";

type Props = {
  assignments: Assignment[];
  isLoading: boolean;
  page: number;
  total: number;
  search: string;
  statusFilter: AssignmentStatus | "";
  onSearchChange: (q: string) => void;
  onStatusFilterChange: (s: AssignmentStatus | "") => void;
  onPageChange: (p: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ActionMenu({
  assignment,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
}: {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const itemClass =
    "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink-muted hover:bg-slate-sunk hover:text-ink";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-faint transition-colors hover:bg-slate-sunk hover:text-ink"
        aria-label="Assignment actions"
      >
        <MoreVertical size={16} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={assignment.title || "Assignment actions"}
        size="sm"
      >
        <nav className="-mx-1 flex flex-col gap-1">
          <Link
            to={`/assignments/${assignment.id}/edit`}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <Pencil size={14} /> Edit
          </Link>
          <Link
            to={`/assignments/${assignment.id}/preview`}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <Eye size={14} /> Preview
          </Link>
          <button
            type="button"
            onClick={() => { onDuplicate(assignment.id); setOpen(false); }}
            className={itemClass}
          >
            <Copy size={14} /> Duplicate
          </button>
          {assignment.status === "draft" && (
            <button
              type="button"
              onClick={() => { onPublish(assignment.id); setOpen(false); }}
              className={cn(itemClass, "text-live hover:bg-live-soft hover:text-live")}
            >
              <Eye size={14} /> Publish
            </button>
          )}
          {assignment.status === "published" && (
            <button
              type="button"
              onClick={() => { onArchive(assignment.id); setOpen(false); }}
              className={itemClass}
            >
              <Archive size={14} /> Archive
            </button>
          )}
          <span className="my-1 border-t border-rule" role="separator" />
          <button
            type="button"
            onClick={() => { onDelete(assignment.id); setOpen(false); }}
            className={cn(itemClass, "text-halt hover:bg-halt-soft hover:text-halt")}
          >
            <Trash2 size={14} /> Delete
          </button>
        </nav>
      </Modal>
    </>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 border border-rule px-4 py-4">
      <div className="h-10 w-10 rounded-full bg-slate-sunk" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded-sm bg-slate-sunk" />
        <div className="h-3 w-24 rounded-sm bg-slate-sunk" />
      </div>
      <div className="h-6 w-16 rounded-full bg-slate-sunk" />
    </div>
  );
}

export function AssignmentListView({
  assignments,
  isLoading,
  page,
  total,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-sm border border-rule bg-slate-sunk py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-ink focus:bg-slate-panel"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as AssignmentStatus | "")}
            className="rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-sm text-ink focus:border-ink"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Link
            to="/assignments/new"
            className="inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> New assignment
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-rule-strong bg-slate-panel py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-sunk">
            <FileText size={24} className="text-ink-faint" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">No assignments yet</p>
          <p className="mt-1 text-xs text-ink-muted">Create your first assignment to get started.</p>
          <Link
            to="/assignments/new"
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse"
          >
            <Plus size={14} /> Create assignment
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="row-hover flex flex-col gap-3 border border-rule bg-slate-panel px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                {/* Mobile: one row (avatar, title, badge, actions) with the
                    metadata beneath it. On sm+ the wrapper turns transparent
                    so these become direct card children again. */}
                <div className="flex items-start gap-3 sm:contents sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-ink-inverse">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/assignments/${a.id}/edit`}
                        className="min-w-0 truncate text-sm font-semibold text-ink hover:underline"
                      >
                        {a.title}
                      </Link>
                      <span className="hidden shrink-0 rounded-sm border border-rule bg-slate-sunk px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted sm:inline">
                        {MODEL_LABELS[a.modelType]}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted tnum">
                      <span className="min-w-0 max-w-full truncate">
                        {a.subjectLabel || "No exam subject"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <HelpCircle size={11} />
                        {getTotalQuestions(a)} Q
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Clock size={11} />
                        {formatDuration(a.duration)}
                      </span>
                      <span className="hidden sm:inline">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 self-start rounded-sm px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs",
                      STATUS_COLORS[a.status]
                    )}
                  >
                    {STATUS_LABELS[a.status]}
                  </span>
                  <ActionMenu
                    assignment={a}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onPublish={onPublish}
                    onArchive={onArchive}
                  />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink-muted transition-colors hover:bg-slate-sunk disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-ink-muted tnum">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink-muted transition-colors hover:bg-slate-sunk disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
