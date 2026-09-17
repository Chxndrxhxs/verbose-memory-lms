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
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            <Link
              to={`/assignments/${assignment.id}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Pencil size={14} /> Edit
            </Link>
            <Link
              to={`/assignments/${assignment.id}/preview`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Eye size={14} /> Preview
            </Link>
            <button
              onClick={() => { onDuplicate(assignment.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Copy size={14} /> Duplicate
            </button>
            {assignment.status === "draft" && (
              <button
                onClick={() => { onPublish(assignment.id); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-zinc-50"
              >
                <Eye size={14} /> Publish
              </button>
            )}
            {assignment.status === "published" && (
              <button
                onClick={() => { onArchive(assignment.id); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <Archive size={14} /> Archive
              </button>
            )}
            <hr className="my-1 border-zinc-100" />
            <button
              onClick={() => { onDelete(assignment.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-100 px-4 py-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-zinc-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-zinc-100" />
        <div className="h-3 w-24 rounded bg-zinc-100" />
      </div>
      <div className="h-6 w-16 rounded-full bg-zinc-100" />
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as AssignmentStatus | "")}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Link
            to="/assignments/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <FileText size={24} className="text-zinc-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-zinc-700">No assignments yet</p>
          <p className="mt-1 text-xs text-zinc-500">Create your first assignment to get started.</p>
          <Link
            to="/assignments/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white"
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
                className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white px-4 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assignments/${a.id}/edit`}
                      className="truncate text-sm font-semibold text-zinc-900 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span className="hidden shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 sm:inline">
                      {MODEL_LABELS[a.modelType]}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{a.course || "Uncategorized"}</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle size={11} />
                      {getTotalQuestions(a)} Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration(a.duration)}
                    </span>
                    <span className="hidden sm:inline">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
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
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-40"
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
