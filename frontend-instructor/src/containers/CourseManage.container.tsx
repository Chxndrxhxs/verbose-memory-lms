import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Info, Pencil, Users, Wrench } from "@masterlms/shared";
import { absoluteMediaUrl, api } from "../lib/api";
import { StudentPreviewModal } from "../components/StudentPreviewModal";

type ApiCourse = {
  id: number;
  title: string;
  status: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
  student_count: number;
  instructor_name: string;
  price: string;
};

async function fetchMine(): Promise<ApiCourse[]> {
  try {
    const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/mine/");
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `about ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `about ${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `about ${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

function CoverPattern({ id, cover }: { id: number; cover: string | null }) {
  if (cover) {
    return <img src={cover} alt="" className="h-full w-full object-cover" />;
  }
  const variant = id % 3;
  const bg = variant === 1 ? "bg-[#1e2e5a]" : variant === 2 ? "bg-[#faf6ef]" : "bg-[#1e2e5a]";
  const grid =
    variant === 2
      ? "bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)]"
      : "bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]";
  return (
    <div className={`relative flex h-full w-full items-center justify-center ${bg} ${grid} bg-[size:22px_22px]`}>
      {variant === 0 && <div className="h-10 w-10 bg-[#d6f0e3] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />}
      {variant === 1 && <div className="h-10 w-10 rounded-full bg-[#f8c9c5]" />}
      {variant === 2 && <div className="h-10 w-10 bg-[#86efac] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />}
    </div>
  );
}

export function CourseManageContainer() {
  const { data, isLoading } = useQuery({ queryKey: ["mine-courses"], queryFn: fetchMine });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const list = data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, query, status]);

  if (isLoading) return <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>;

  if (list.length === 0) {
    return (
      <div className="rounded-[20px] border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-zinc-500">No courses yet.</p>
        <Link to="/courses/create" className="mt-3 inline-flex rounded-full bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white">
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
          <div className="relative">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Add Filters <span className="text-[10px]">▼</span>
            </button>
            {filtersOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-40 overflow-hidden rounded-2xl border bg-white shadow-lg">
                {(["all", "published", "draft"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setFiltersOpen(false);
                    }}
                    className={`flex w-full px-3 py-2 text-left text-xs font-medium hover:bg-zinc-50 ${status === s ? "bg-zinc-900 text-white hover:bg-zinc-900" : "text-zinc-700"}`}
                  >
                    {s === "all" ? "All courses" : s === "published" ? "Published" : "Unpublished"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Course Title"
            className="min-w-0 flex-1 rounded-full bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:bg-white focus:ring-1 focus:ring-zinc-200"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <div className="flex overflow-hidden rounded-xl border bg-white shadow-sm">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`px-4 py-2 ${view === "list" ? "bg-[#0f172a] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              <span className="flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
                  <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                  <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`px-4 py-2 ${view === "grid" ? "bg-[#3478ff] text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              <span className="flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="2" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="6" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="2" y="10" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="6" y="10" width="4" height="4" rx="1" fill="currentColor" />
                  <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">No courses match your filters.</p>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const cover = absoluteMediaUrl(c.cover_image);
            const unpublished = c.status !== "published";
            return (
              <div key={c.id} className="flex flex-col overflow-hidden rounded-[20px] border bg-white shadow-sm transition hover:shadow-md">
                <div className="relative h-36 overflow-hidden bg-zinc-100">
                  <CoverPattern id={c.id} cover={cover} />
                  {unpublished && (
                    <div className="absolute left-0 top-3 -rotate-[32deg] bg-[#c45a3a] px-8 py-1 text-[10px] font-extrabold tracking-widest text-white shadow">
                      UNPUBLISHED
                    </div>
                  )}
                </div>

                <div className="flex-1 p-3">
                  <Link to={`/courses/${c.id}`} className="line-clamp-1 text-sm font-semibold text-[#3478ff] hover:underline">
                    {c.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{c.instructor_name || "Instructor"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                      Enrolled Learners
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-300 text-[9px] font-bold leading-none">i</span>
                      <span className="font-bold text-[#3478ff]">{c.student_count}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(c.updated_at || c.created_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 divide-x border-t bg-white">
                  <Link to={`/courses/${c.id}`} className="flex items-center justify-center py-2.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" title="Info">
                    <Info size={15} strokeWidth={2} />
                  </Link>
                  <Link to={`/courses/${c.id}`} className="flex items-center justify-center py-2.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" title="Settings">
                    <Wrench size={15} strokeWidth={2} />
                  </Link>
                  <Link to={`/courses/${c.id}`} className="flex items-center justify-center py-2.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" title="Edit">
                    <Pencil size={15} strokeWidth={2} />
                  </Link>
                  <Link to={`/courses/${c.id}`} className="flex items-center justify-center py-2.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" title="Learners">
                    <Users size={15} strokeWidth={2} />
                  </Link>
                  <button onClick={() => setPreviewId(c.id)} className="flex items-center justify-center py-2.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900" title="Preview">
                    <Eye size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((c) => {
            const cover = absoluteMediaUrl(c.cover_image);
            const unpublished = c.status !== "published";
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  <CoverPattern id={c.id} cover={cover} />
                  {unpublished && (
                    <span className="absolute left-1 top-1 rounded-full bg-[#c45a3a] px-1.5 py-0.5 text-[9px] font-bold text-white">UNPUBLISHED</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/courses/${c.id}`} className="line-clamp-1 text-sm font-semibold text-[#3478ff] hover:underline">
                    {c.title}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">
                    {c.instructor_name || "Instructor"} • {c.student_count} learners • {timeAgo(c.updated_at || c.created_at)}
                  </p>
                </div>
                <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:inline-flex ${unpublished ? "bg-amber-400 text-zinc-900" : "bg-emerald-500 text-white"}`}>
                  {unpublished ? "Unpublished" : "Published"}
                </span>
                <Link to={`/courses/${c.id}`} className="hidden shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 sm:inline-flex">
                  Edit
                </Link>
                <button onClick={() => setPreviewId(c.id)} className="shrink-0 rounded-full border p-2 text-zinc-600 hover:bg-zinc-50" title="Preview">
                  <Eye size={14} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {previewId !== null && <StudentPreviewModal courseId={String(previewId)} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
