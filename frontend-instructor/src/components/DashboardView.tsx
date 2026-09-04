import { Link } from "react-router-dom";
import { ArrowRight } from "@masterlms/shared";
import { InstructorHeader } from "./InstructorHeader";
import { StatCard } from "./StatCard";
import { useAuth } from "../hooks/useAuth";
import type { InstructorOverview } from "../containers/Dashboard.container";

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function priceLabel(price: string): string {
  const n = Number(price);
  if (!n) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function DashboardView({
  overview,
  isLoading,
}: {
  overview: InstructorOverview | null;
  isLoading: boolean;
}) {
  const user = useAuth((s) => s.user);
  const firstName = user?.name?.split(" ")[0] || "Instructor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const students = overview?.total_students ?? 0;
  const revenue = overview?.revenue_inr ?? 0;
  const courses = overview?.total_courses ?? 0;
  const drafts = overview?.drafts ?? 0;
  const rating = overview && Number(overview.average_rating) > 0 ? Number(overview.average_rating).toFixed(1) : "New";
  const recent = overview?.recent_enrollments ?? [];

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{greeting}, {firstName}</h1>
            <p className="text-sm text-zinc-500">Here’s what’s happening with your courses today.</p>
          </div>
          <Link to="/courses/create" className="rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white">+ Create course</Link>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-zinc-100" />
                <div className="mt-3 h-3 w-20 rounded bg-zinc-100" />
                <div className="mt-2 h-7 w-24 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total students" value={students.toLocaleString("en-IN")} sub={students === 0 ? "Share your course link" : "enrolled learners"} icon="◉" accent="bg-[#3478ff]" />
            <StatCard label="Revenue" value={`₹${revenue.toLocaleString("en-IN")}`} sub={revenue === 0 ? "No sales yet" : "lifetime earnings"} icon="₹" accent="bg-emerald-600" />
            <StatCard label="Courses" value={String(courses)} sub={drafts === 0 ? (courses === 0 ? "Create your first" : "all published") : `${drafts} draft${drafts === 1 ? "" : "s"}`} icon="▭" accent="bg-zinc-900" />
            <StatCard label="Rating" value={rating} sub={overview?.top_course ? `top: ${overview.top_course.title}` : "no ratings yet"} icon="★" accent="bg-yellow-400 !text-zinc-900" />
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Recent enrollments</h3><Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478ff]">View all <ArrowRight size={12} strokeWidth={2.5} /></Link></div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : recent.length === 0 ? (
                <div className="rounded-xl border border-dashed px-3 py-8 text-center">
                  <p className="text-sm font-semibold">No enrollments yet</p>
                  <p className="mt-1 text-xs text-zinc-500">Publish a course and share your link to get your first learners.</p>
                  <Link to="/courses/create" className="mt-3 inline-block rounded-full bg-[#0f172a] px-4 py-2 text-xs font-bold text-white">Create course</Link>
                </div>
              ) : (
                recent.map((e) => (
                  <div key={`${e.learner}-${e.course}-${e.enrolled_at}`} className="flex items-center justify-between rounded-xl border px-3 py-3">
                    <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-zinc-100" /><div><p className="text-sm font-semibold">{e.learner}</p><p className="text-xs text-zinc-500">{e.course}</p></div></div>
                    <div className="text-right"><p className="text-xs font-semibold">{priceLabel(e.price)}</p><p className="text-[11px] text-zinc-400">{timeAgo(e.enrolled_at)}</p></div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold">Quick actions</h3>
            <div className="mt-4 grid gap-2">
              <Link to="/courses/create" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">Create new course</p><p className="text-xs text-zinc-500">Start from scratch</p></Link>
              <Link to="/assignments" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">Review assignments</p><p className="text-xs text-zinc-500">Pending reviews</p></Link>
              <Link to="/analytics" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">View analytics</p><p className="text-xs text-zinc-500">Revenue & students</p></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
