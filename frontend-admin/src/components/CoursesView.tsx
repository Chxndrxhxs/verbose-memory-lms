import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Search, Trash2 } from "@masterlms/shared";
import type { AdminCourse } from "../types/admin";
import { cn } from "../lib/utils";
import { Card } from "./Card";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";

export function CoursesView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  status,
  onStatus,
  searchLoading,
  loading,
  error,
  togglingId,
  onToggle,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminCourse[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  status: "" | "draft" | "published";
  onStatus: (v: "" | "draft" | "published") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  togglingId?: number;
  onToggle: (id: number, status: "draft" | "published") => void;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminCourse | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Courses</h1>
        <p className="text-sm text-zinc-500">Edit, publish, unpublish or remove any course on the platform.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={2.5} />
            <input
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search title, instructor or category…"
              className="w-full rounded-xl border bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zinc-900"
            />
            {searchLoading && <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-ping rounded-full bg-zinc-400" />}
          </div>
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value as "" | "draft" | "published")}
            className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-10 w-14 rounded-lg bg-zinc-200" />
                <div className="h-4 w-52 rounded bg-zinc-200" />
                <div className="ml-auto h-4 w-16 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : data.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No courses match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-semibold">Course</th>
                  <th className="px-5 py-3 font-semibold">Instructor</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Students</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.cover_image ? (
                          <img src={c.cover_image} alt="" className="h-10 w-14 rounded-lg object-cover bg-zinc-100" />
                        ) : (
                          <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-bold text-zinc-400">
                            NO IMG
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link to={`/courses/${c.id}`} className="block max-w-[240px] truncate font-semibold text-zinc-800 hover:underline">
                            {c.title}
                          </Link>
                          <p className="truncate text-xs text-zinc-400">{c.category}{c.subtitle ? ` · ${c.subtitle}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{c.instructor_name}</td>
                    <td className="px-5 py-3 font-semibold text-zinc-700">
                      {c.pricing_type === "free" ? "Free" : `₹${Number(c.price).toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{c.student_count}</td>
                    <td className="px-5 py-3 text-zinc-600">{Number(c.average_rating).toFixed(1)} ★</td>
                    <td className="px-5 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/courses/${c.id}`} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#0f172a] hover:bg-zinc-100">
                          View
                        </Link>
                        <button
                          onClick={() => onToggle(c.id, c.status === "published" ? "draft" : "published")}
                          disabled={togglingId === c.id}
                          title={c.status === "published" ? "Unpublish" : "Publish"}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          {c.status === "published" ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                        </button>
                        <button
                          onClick={() => setTarget(c)}
                          disabled={deleting && deletingId === c.id}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5">
          <Pagination page={page} pages={pages} total={total} onChange={onPage} />
        </div>
      </Card>

      <ConfirmDialog
        open={target !== null}
        title="Delete this course?"
        description={`Permanently remove "${target?.title}" and all its sections and lessons? Learner enrollments in it will also be removed. This cannot be undone.`}
        busy={deleting}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}