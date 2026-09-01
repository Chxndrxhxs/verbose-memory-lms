import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "@masterlms/shared";
import { api } from "../lib/api";

type ApiCourse = { id: number; title: string; status: string; cover_image: string; updated_at: string; student_count: number; price: string };

async function fetchMine(): Promise<ApiCourse[]> {
  try {
    const data = await api<{ results: ApiCourse[] } | ApiCourse[]>("/courses/mine/");
    return Array.isArray(data) ? data : data.results ?? [];
  } catch { return []; }
}

export function CourseManageContainer() {
  const { data, isLoading } = useQuery({ queryKey: ["mine-courses"], queryFn: fetchMine });

  if (isLoading) return <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>;
  const list = data ?? [];
  if (list.length === 0) return <p className="py-6 text-center text-sm text-zinc-500">No courses yet. <Link to="/courses/new" className="inline-flex items-center gap-1 text-[#3478ff] font-semibold">Create one <ArrowRight size={12} strokeWidth={2.5} /></Link></p>;

  return (
    <div className="space-y-3">
      {list.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
          <img src={c.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-14 w-20 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">{c.title}</p>
            <p className="text-xs text-zinc-500">{new Date(c.updated_at).toLocaleDateString()} • {c.student_count} students • {Number(c.price) === 0 ? "Free" : `$${c.price}`}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.status === "published" ? "bg-emerald-500 text-white" : "bg-yellow-400 text-zinc-900"}`}>{c.status}</span>
          <Link to={`/courses/${c.id}`} className="rounded-full border px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50">Edit</Link>
        </div>
      ))}
    </div>
  );
}
