import { useQuery } from "@tanstack/react-query";
import { InstructorHeader } from "../components/InstructorHeader";
import { api } from "../lib/api";

type OverviewCourse = {
  id: number;
  title: string;
  students: number;
  price: string;
  status: string;
};

type Overview = {
  total_students: number;
  revenue_inr: number;
  top_course: { id: number; title: string; students: number } | null;
  courses: OverviewCourse[];
};

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-overview"],
    queryFn: () => api<Overview>("/instructor/overview"),
  });

  const students = data?.total_students ?? 0;
  const revenue = data?.revenue_inr ?? 0;
  const courses = data?.courses ?? [];
  const maxStudents = Math.max(1, ...courses.map((c) => c.students));

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Revenue</p><p className="mt-1 text-2xl font-black">{isLoading ? "…" : `₹${revenue.toLocaleString("en-IN")}`}</p><div className="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-[#3478ff]" style={{ width: `${revenue > 0 ? 100 : 0}%` }} /></div></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Enrollments</p><p className="mt-1 text-2xl font-black">{isLoading ? "…" : students.toLocaleString("en-IN")}</p>
            {courses.length > 0 ? (
              <div className="mt-3 flex h-[70px] items-end gap-1">{courses.slice(0, 7).map((c) => (
                <div key={c.id} title={`${c.title}: ${c.students}`} className="flex-1 rounded bg-emerald-500" style={{ height: `${Math.max(6, Math.round((c.students / maxStudents) * 70))}px` }} />
              ))}</div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">No enrollments yet</p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Top course</p><p className="mt-1 text-sm font-bold">{data?.top_course ? data.top_course.title : isLoading ? "…" : "—"}</p><p className="text-xs text-zinc-500">{data?.top_course ? `${data.top_course.students} students` : "Publish to see stats"}</p></div>
        </div>
      </div>
    </div>
  );
}
