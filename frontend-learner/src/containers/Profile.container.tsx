import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { User, ArrowRight } from "@masterlms/shared";
import { ActivityHeatmap, HeatmapLegend } from "../components/ActivityHeatmap";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

type Enrollment = {
  id: number;
  course: { id: number; title: string; cover_image: string; instructor_name: string; price: string };
  progress: number;
  enrolled_at: string;
};

type ActivityDay = { date: string; count: number };

type UpdatedUser = { name: string; email: string; mobile: string; age: number; avatar: string };

function levelFromCount(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const pct = count / max;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

export function ProfileContainer() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [age, setAge] = useState<string>(user?.age?.toString() ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [toast, setToast] = useState<string | null>(null);

  const enrollmentsQ = useQuery({
    queryKey: ["me", "courses"],
    queryFn: async () => {
      const res = await api<Enrollment[] | { results: Enrollment[] }>("/me/courses");
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const activityQ = useQuery({
    queryKey: ["me", "activity"],
    queryFn: async () => api<ActivityDay[]>("/me/activity/"),
  });

  const saveMut = useMutation({
    mutationFn: (payload: { name: string; email: string; age?: number; avatar: string }) =>
      api<UpdatedUser>("/auth/complete-profile", { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (updated) => {
      setUser({ ...(user as { name: string; email: string; mobile: string }), ...updated, avatar: updated.avatar || avatar || undefined });
      setToast("Profile updated");
      setEditing(false);
      setTimeout(() => setToast(null), 1800);
    },
    onError: (e) => {
      setToast(String(e));
      setTimeout(() => setToast(null), 2200);
    },
  });

  if (!user) return null;

  const enrollments = enrollmentsQ.data ?? [];
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.progress >= 100).length;
  const avg = total ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / total) : 0;

  const activity = activityQ.data ?? [];
  const maxCount = activity.reduce((m, d) => (d.count > m ? d.count : m), 0);
  const cells = activity.map((d) => ({ date: d.date, level: levelFromCount(d.count, maxCount) }));

  const save = () => {
    saveMut.mutate({
      name,
      email,
      age: age ? Number(age) : undefined,
      avatar: avatar || "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <div className="px-3 pt-6 sm:px-4">
        <div className="mx-auto max-w-[1100px]">
          <div className="rounded-[28px] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/20 bg-zinc-700 sm:h-24 sm:w-24">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-bold">{user.name?.[0] ?? "?"}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight">{user.name || "Learner"}</h1>
                <p className="text-sm text-white/70">{user.email || user.mobile}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">Age {user.age ?? "—"}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">{user.mobile}</span>
                </div>
              </div>
              <button onClick={() => setEditing((v) => !v)} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-100">{editing ? "Cancel" : "Edit profile"}</button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Enrolled</p><p className="mt-1 text-2xl font-black">{total}</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Completed</p><p className="mt-1 text-2xl font-black">{completed}</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Avg. progress</p><p className="mt-1 text-2xl font-black">{avg}%</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Lessons done</p><p className="mt-1 text-2xl font-black">{activity.reduce((s, d) => s + d.count, 0)}</p></div>
            </div>
          </div>

          {editing && (
            <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-bold">Edit profile</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-semibold">Name</label><input value={name} onChange={(e)=> setName(e.target.value)} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div><label className="text-xs font-semibold">Email</label><input value={email} onChange={(e)=> setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div><label className="text-xs font-semibold">Age</label><input value={age} onChange={(e)=> setAge(e.target.value)} type="number" min="13" max="80" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div>
                  <label className="text-xs font-semibold">Avatar</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100">
                      {avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" /> : <span className="flex h-full w-full items-center justify-center text-xs"><User size={20} className="text-zinc-400" /></span>}
                    </div>
                    <label className="rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50">Upload<input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setAvatar(r.result as string); r.readAsDataURL(f); }} /></label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={save} disabled={saveMut.isPending} className="rounded-full bg-[#0f172a] px-5 py-2 text-xs font-bold text-white disabled:opacity-60">{saveMut.isPending ? "Saving…" : "Save changes"}</button>
                <button onClick={()=> setEditing(false)} className="rounded-full border px-5 py-2 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Activity</h2>
                <span className="text-xs text-zinc-500">last 6 months</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Lessons, assignments, and quizzes completed.</p>
              <div className="mt-4">
                {activityQ.isLoading ? (
                  <p className="text-sm text-zinc-500">Loading…</p>
                ) : (
                  <ActivityHeatmap cells={cells} weeks={26} />
                )}
              </div>
              <HeatmapLegend />
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold">Account</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Email</p><p className="text-sm">{user.email || "—"}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Mobile</p><p className="text-sm">{user.mobile}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Role</p><p className="text-sm capitalize">{user.role ?? "Learner"}</p></div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">My courses</h2>
              <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478ff]">Browse <ArrowRight size={12} strokeWidth={2.5} /></Link>
            </div>
            {enrollmentsQ.isLoading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : total === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No enrollments yet. <Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-[#3478ff]">Browse courses <ArrowRight size={12} strokeWidth={2.5} /></Link></p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {enrollments.map((e) => (
                  <Link key={e.id} to={`/courses/${e.course.id}`} className="flex gap-3 rounded-2xl border bg-zinc-50 p-3 hover:bg-zinc-100">
                    <img src={e.course.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-16 w-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{e.course.title}</p>
                      <p className="text-xs text-zinc-500">by {e.course.instructor_name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full bg-emerald-500" style={{ width: `${e.progress}%` }} /></div>
                      <p className="mt-1 text-[10px] text-zinc-500">{e.progress}% complete</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}