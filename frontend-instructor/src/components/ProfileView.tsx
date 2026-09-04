import { Link } from "react-router-dom";
import { User, ArrowRight, Trash2, AlertTriangle } from "@masterlms/shared";
import { InstructorHeader } from "./InstructorHeader";
import type { SharedInstructorCourse as InstructorCourse } from "@masterlms/shared";

type AuthUser = {
  name?: string;
  email?: string;
  mobile: string;
  age?: number;
  avatar?: string;
  role?: string;
};

type Props = {
  user: AuthUser;
  editing: boolean;
  confirmDelete: boolean;
  deleteConfirmText: string;
  name: string;
  email: string;
  age: string;
  avatar: string | null;
  avatarUploading: boolean;
  saving: boolean;
  deleting: boolean;
  toast: string | null;
  courses: InstructorCourse[];
  loading: boolean;
  onToggleEditing: () => void;
  onCancelEditing: () => void;
  onConfirmDeleteOpen: () => void;
  onConfirmDeleteClose: () => void;
  onDeleteConfirmText: (v: string) => void;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onAge: (v: string) => void;
  onAvatarPicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onDelete: () => void;
  onInvalidateCourses: () => void;
};

function Heatmap({ weeks = 26 }: { weeks?: number }) {
  const cells: { d: string; level: number }[] = [];
  const today = new Date();
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const seed = (d.getDate() * 7 + d.getMonth() * 13 + d.getDay()) % 17;
    const level = seed < 9 ? 0 : seed < 12 ? 1 : seed < 14 ? 2 : seed < 16 ? 3 : 4;
    cells.push({ d: k, level });
  }
  const colors = ["bg-zinc-100", "bg-yellow-200", "bg-yellow-400", "bg-yellow-500", "bg-yellow-600"];
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-fit">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="grid grid-rows-7 gap-1">
            {Array.from({ length: 7 }).map((__, d) => {
              const c = cells[w * 7 + d];
              return <span key={d} className={`h-3 w-3 rounded-sm ${colors[c.level]}`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileView(p: Props) {
  const { user, courses } = p;
  const total = courses.length;
  const published = courses.filter((c) => c.status === "published").length;
  const draft = total - published;
  const totalStudents = courses.reduce((a, c) => a + c.student_count, 0);
  const avgRating = courses.length
    ? (courses.reduce((a, c) => a + Number(c.average_rating || 0), 0) / courses.length).toFixed(1)
    : "0.0";

  return (
    <>
      <InstructorHeader />
      <div className="min-h-screen bg-[#f6f5f1]">
        <div className="px-4 pt-6 sm:px-6">
          <div className="w-full">
          <div className="rounded-[28px] bg-gradient-to-br from-zinc-900 via-amber-900 to-zinc-900 p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400/40 bg-zinc-700 sm:h-24 sm:w-24">
                {p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-bold">{user.name?.[0] ?? "?"}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight">{user.name || "Instructor"}</h1>
                  <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
                </div>
                <p className="text-sm text-white/70">{user.email || user.mobile}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">Age {user.age ?? "—"}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold">{user.mobile}</span>
                </div>
              </div>
              <button onClick={p.onToggleEditing} className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-yellow-500">{p.editing ? "Cancel" : "Edit profile"}</button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Courses</p><p className="mt-1 text-2xl font-black">{total}</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Published</p><p className="mt-1 text-2xl font-black">{published}</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Students</p><p className="mt-1 text-2xl font-black">{totalStudents}</p></div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Avg. rating</p><p className="mt-1 text-2xl font-black">{avgRating}</p></div>
            </div>
          </div>

          {p.editing && (
            <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-sm font-bold">Edit profile</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-semibold">Name</label><input value={p.name} onChange={(e)=> p.onName(e.target.value)} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div><label className="text-xs font-semibold">Email</label><input value={p.email} onChange={(e)=> p.onEmail(e.target.value)} type="email" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div><label className="text-xs font-semibold">Age</label><input value={p.age} onChange={(e)=> p.onAge(e.target.value)} type="number" min="13" max="80" className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                <div>
                  <label className="text-xs font-semibold">Avatar</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100">
                      {p.avatar ? <img src={p.avatar} className="h-full w-full object-cover" alt="" /> : <span className="flex h-full w-full items-center justify-center text-xs"><User size={20} className="text-zinc-400" /></span>}
                    </div>
                    <label className="rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50">{p.avatarUploading ? "Uploading…" : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={p.onAvatarPicked} disabled={p.avatarUploading} /></label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={p.onSave} disabled={p.saving || p.avatarUploading} className="rounded-full bg-[#0f172a] px-5 py-2 text-xs font-bold text-white disabled:opacity-60">{p.saving || p.avatarUploading ? "Saving…" : "Save changes"}</button>
                <button onClick={p.onCancelEditing} className="rounded-full border px-5 py-2 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[28px] bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Activity</h2>
                <span className="text-xs text-zinc-500">last 6 months</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Courses published, lessons added, edits.</p>
              <div className="mt-4">
                <Heatmap weeks={26} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
                <span>Less</span>
                <span className="h-3 w-3 rounded-sm bg-zinc-100" />
                <span className="h-3 w-3 rounded-sm bg-yellow-200" />
                <span className="h-3 w-3 rounded-sm bg-yellow-400" />
                <span className="h-3 w-3 rounded-sm bg-yellow-500" />
                <span className="h-3 w-3 rounded-sm bg-yellow-600" />
                <span>More</span>
              </div>
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold">Account</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Email</p><p className="text-sm">{user.email || "—"}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Mobile</p><p className="text-sm">{user.mobile}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Role</p><p className="text-sm capitalize">{user.role ?? "Instructor"}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Drafts</p><p className="text-sm">{draft} course{draft === 1 ? "" : "s"}</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700"><AlertTriangle size={15} /> Danger zone</div>
                <p className="mt-1 text-xs text-red-600">Deleting your account permanently removes your profile, courses, and data from QTNXT.</p>
                {p.confirmDelete ? (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="text-xs font-semibold text-zinc-700">Type <span className="font-mono font-bold">delete</span> to confirm:</p>
                    <div className="mt-2 flex gap-2">
                      <input value={p.deleteConfirmText} onChange={(e) => p.onDeleteConfirmText(e.target.value)} placeholder="delete" className="flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={p.onConfirmDeleteClose}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                      >Cancel</button>
                      <button
                        onClick={p.onDelete}
                        disabled={p.deleteConfirmText !== "delete" || p.deleting}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {p.deleting ? "Deleting…" : "Delete permanently"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={p.onConfirmDeleteOpen} className="mt-2 flex items-center gap-1.5 rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 size={13} /> Delete account</button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Your courses</h2>
              <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478ff]">Manage <ArrowRight size={12} strokeWidth={2.5} /></Link>
            </div>
            {p.loading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : total === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No courses yet. <Link to="/courses/create" className="inline-flex items-center gap-1 font-semibold text-[#3478ff]">Create one <ArrowRight size={12} strokeWidth={2.5} /></Link></p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {courses.map((c) => (
                  <Link key={c.id} to={`/courses/${c.id}`} className="flex gap-3 rounded-2xl border bg-zinc-50 p-3 hover:bg-zinc-100">
                    <img src={c.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-16 w-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold leading-tight">{c.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status === "published" ? "bg-emerald-500 text-white" : "bg-yellow-400 text-zinc-900"}`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{c.student_count} students • {Number(c.price) === 0 ? "Free" : `₹${Number(c.price).toLocaleString("en-IN")}`}</p>
                      <p className="text-[10px] text-zinc-400">Updated {new Date(c.updated_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        {p.toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{p.toast}</div>}
      </div>
    </>
  );
}
