import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2 } from "@masterlms/shared";
import type { AdminEnrollment } from "../types/admin";
import { cn } from "../lib/utils";
import { Card } from "./Card";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";

export function EnrollmentsView({
  data,
  total,
  pages,
  page,
  onPage,
  q,
  onSearch,
  progress,
  onProgress,
  searchLoading,
  loading,
  error,
  onDelete,
  deleting,
  deletingId,
}: {
  data: AdminEnrollment[];
  total: number;
  pages: number;
  page: number;
  onPage: (p: number) => void;
  q: string;
  onSearch: (v: string) => void;
  progress: "" | "active" | "done";
  onProgress: (v: "" | "active" | "done") => void;
  searchLoading: boolean;
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  deleting: boolean;
  deletingId?: number;
}) {
  const [target, setTarget] = useState<AdminEnrollment | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Enrollments</h1>
        <p className="text-sm text-zinc-500">Every learner–course enrollment on the platform.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={2.5} />
            <input
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search learner or course…"
              className="w-full rounded-xl border bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zinc-900"
            />
            {searchLoading && <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-ping rounded-full bg-zinc-400" />}
          </div>
          <select
            value={progress}
            onChange={(e) => onProgress(e.target.value as "" | "active" | "done")}
            className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 outline-none"
          >
            <option value="">All progress</option>
            <option value="active">In progress</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-4 w-32 rounded bg-zinc-200" />
                <div className="ml-auto h-4 w-16 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : data.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">No enrollments match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-semibold">Learner</th>
                  <th className="px-5 py-3 font-semibold">Course</th>
                  <th className="px-5 py-3 font-semibold">Instructor</th>
                  <th className="px-5 py-3 font-semibold">Progress</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {e.learner_avatar ? (
                          <img src={e.learner_avatar} alt="" className="h-8 w-8 rounded-full bg-zinc-200" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-400">
                            {e.learner_name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link to={`/users/${e.learner_id}`} className="block truncate font-semibold text-zinc-800 hover:underline">{e.learner_name}</Link>
                          <p className="text-xs text-zinc-400">+91 {e.learner_mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/courses/${e.course_id}`} className="block max-w-[240px] truncate font-semibold text-zinc-800 hover:underline">{e.course_title}</Link>
                      <p className="text-xs text-zinc-400">
                        {Number(e.course_price) === 0 ? "Free course" : `₹${Number(e.course_price).toLocaleString("en-IN")}`}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{e.instructor}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                          <div className={cn("h-full rounded-full", e.progress === 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${e.progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-zinc-600">{e.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setTarget(e)}
                        disabled={deleting && deletingId === e.id}
                        className="ml-auto flex rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
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
        title="Remove enrollment?"
        description={`Remove ${target?.learner_name} from "${target?.course_title}"? Their progress in this course is lost. This cannot be undone.`}
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