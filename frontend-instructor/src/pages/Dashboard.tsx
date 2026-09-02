import { Link } from "react-router-dom";
import { ArrowRight } from "@masterlms/shared";
import { InstructorHeader } from "../components/InstructorHeader";
import { StatCard } from "../components/StatCard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Good morning, Ayse 👋</h1>
            <p className="text-sm text-zinc-500">Here’s what’s happening with your courses today.</p>
          </div>
          <Link to="/courses/create" className="rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white">+ Create course</Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total students" value="12,438" sub="+214 this week" icon="◉" accent="bg-[#3478ff]" />
          <StatCard label="Revenue" value="₹8,420" sub="+₹640 this week" icon="₹" accent="bg-emerald-600" />
          <StatCard label="Courses" value="6" sub="2 drafts" icon="▭" accent="bg-zinc-900" />
          <StatCard label="Rating" value="4.9" sub="1,203 reviews" icon="★" accent="bg-yellow-400 !text-zinc-900" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Recent enrollments</h3><Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478ff]">View all <ArrowRight size={12} strokeWidth={2.5} /></Link></div>
            <div className="mt-4 space-y-3">
              {[
                ["Maya Chen", "UX/UI Fundamentals", "2h ago", "Free"],
                ["James Park", "Business Leadership", "5h ago", "₹1,999"],
                ["Sara Kim", "Python Basics", "1d ago", "₹499"],
              ].map(([name, course, time, price]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border px-3 py-3">
                  <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-zinc-100" /><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-zinc-500">{course}</p></div></div>
                  <div className="text-right"><p className="text-xs font-semibold">{price}</p><p className="text-[11px] text-zinc-400">{time}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold">Quick actions</h3>
            <div className="mt-4 grid gap-2">
              <Link to="/courses/create" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">Create new course</p><p className="text-xs text-zinc-500">Start from scratch</p></Link>
              <Link to="/assignments" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">Review assignments</p><p className="text-xs text-zinc-500">3 pending</p></Link>
              <Link to="/analytics" className="rounded-xl border bg-zinc-50 p-4 hover:bg-white"><p className="text-sm font-bold">View analytics</p><p className="text-xs text-zinc-500">Revenue & students</p></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
