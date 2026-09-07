import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  DollarSign,
  FileText,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "@masterlms/shared";
import type { AdminDashboard } from "../types/admin";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={15} strokeWidth={2.5} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function Skeleton() {
  const bars = [5, 4, 2, 4, 5, 3, 4];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {bars.map((w, i) => (
        <div key={i} className="animate-pulse rounded-2xl border bg-white p-5 shadow-sm">
          <div className={`h-3 rounded bg-zinc-200 w-${w}0`} />
          <div className="mt-3 h-7 w-16 rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

export function DashboardView({
  data,
  isLoading,
  error,
}: {
  data?: AdminDashboard;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) return <Skeleton />;
  if (error || !data) return <div className="text-sm text-red-600">{error ?? "No data"}</div>;
  const d = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">Platform overview across {d.users.total} registered users.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Users" value={d.users.total} icon={Users} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Learners" value={d.users.learners} icon={User} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Instructors" value={d.users.instructors} icon={User} accent="bg-violet-50 text-violet-600" />
        <StatCard label="Courses" value={d.courses.total} icon={FileText} accent="bg-amber-50 text-amber-600" />
        <StatCard label="Enrollments" value={d.enrollments.total} icon={Bookmark} accent="bg-rose-50 text-rose-600" />
        <StatCard label="Revenue (₹)" value={d.revenue_inr.toLocaleString("en-IN")} icon={DollarSign} accent="bg-green-50 text-green-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Courses</h2>
            <TrendingUp size={18} className="text-zinc-400" strokeWidth={2.5} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {d.courses.published} published · {d.courses.drafts} drafts
          </p>
          <div className="mt-3 space-y-2">
            <Bar label="Paid courses" value={d.courses.paid} total={d.courses.total} color="bg-[#0f172a]" />
            <Bar label="Free courses" value={d.courses.free} total={d.courses.total} color="bg-zinc-300" />
            <Bar label="Published" value={d.courses.published} total={d.courses.total} color="bg-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">Enrollments</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {d.enrollments.in_progress} in progress · {d.enrollments.completed} completed
          </p>
          <div className="mt-3 space-y-2">
            <Bar label="In progress" value={d.enrollments.in_progress} total={d.enrollments.total} color="bg-blue-500" />
            <Bar label="Completed" value={d.enrollments.completed} total={d.enrollments.total} color="bg-emerald-500" />
          </div>
          <p className="mt-4 text-xs font-semibold text-zinc-600">
            ₹{d.revenue_inr.toLocaleString("en-IN")} collected across {d.payments_paid} paid orders
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">Top categories</h2>
          <div className="mt-3 space-y-2">
            {d.top_categories.length === 0 && <p className="text-xs text-zinc-400">No courses yet.</p>}
            {d.top_categories.map((c) => (
              <div key={c.category} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">{c.category}</span>
                <span className="text-xs font-semibold text-zinc-400">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent users</h2>
            <Link to="/users" className="flex items-center gap-1 text-xs font-semibold text-[#0f172a] hover:underline">
              All users <ArrowUpRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="divide-y">
            {d.recent_users.map((u) => (
              <Link key={u.id} to={`/users/${u.id}`} className="flex items-center gap-3 py-2.5 hover:bg-zinc-50">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="h-8 w-8 rounded-full bg-zinc-200 object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                    {(u.name[0] ?? "?").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-800">{u.name}</p>
                  <p className="truncate text-xs text-zinc-400">+91 {u.mobile}</p>
                </div>
                <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
                  {u.role}
                </span>
              </Link>
            ))}
            {d.recent_users.length === 0 && <p className="py-4 text-xs text-zinc-400">No users yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent enrollments</h2>
            <Link to="/enrollments" className="flex items-center gap-1 text-xs font-semibold text-[#0f172a] hover:underline">
              All enrollments <ArrowUpRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="divide-y">
            {d.recent_enrollments.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-800">{e.course}</p>
                  <p className="truncate text-xs text-zinc-400">{e.learner} · {new Date(e.enrolled_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600">{e.progress}%</span>
              </div>
            ))}
            {d.recent_enrollments.length === 0 && <p className="py-4 text-xs text-zinc-400">No enrollments yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-600">{label}</span>
        <span className="font-semibold text-zinc-400">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}