import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { User, ArrowRight, Trash2, AlertTriangle, Download, Receipt, Award, Eye } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { useAuth } from "../hooks/useAuth";
import { absoluteMediaUrl, api, uploadFile } from "../lib/api";

type Enrollment = {
  id: number;
  course: { id: number; title: string; cover_image: string; instructor_name: string; price: string };
  progress: number;
  enrolled_at: string;
};

type Payment = {
  id: number;
  course: { id: number; title: string; cover_image: string; price: string };
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

type Certificate = {
  id: number;
  certificate_id: string;
  course: { id: number; title: string; cover_image: string };
  learner_name: string;
  enrolled_at: string;
  issued_at: string;
};

type UpdatedUser = { name: string; email: string; mobile: string; age: number; avatar: string };

export function ProfileContainer() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [age, setAge] = useState<string>(user?.age?.toString() ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const enrollmentsQ = useQuery({
    queryKey: ["me", "courses"],
    queryFn: async () => {
      const res = await api<Enrollment[] | { results: Enrollment[] }>("/me/courses");
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const paymentsQ = useQuery({
    queryKey: ["me", "payments"],
    queryFn: async () => {
      try {
        const res = await api<Payment[]>("/payments/my-payments");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const certsQ = useQuery({
    queryKey: ["me", "certificates"],
    queryFn: async () => {
      try {
        const res = await api<Certificate[]>("/me/certificates");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const [viewCert, setViewCert] = useState<Certificate | null>(null);

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

  const deleteMut = useMutation({
    mutationFn: () => api<{ message: string }>("/users/me", { method: "DELETE" }),
    onSuccess: async () => {
      await logout();
      nav("/login");
    },
    onError: (e) => {
      setToast(String(e));
      setTimeout(() => setToast(null), 2200);
    },
  });

  if (!user) return null;

  const enrollmentsRaw: unknown = enrollmentsQ.data;
  const enrollments: Enrollment[] = Array.isArray(enrollmentsRaw) ? (enrollmentsRaw as Enrollment[]) : ((enrollmentsRaw as { results?: Enrollment[] })?.results ?? (enrollmentsRaw as { data?: Enrollment[] })?.data ?? []);
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.progress >= 100).length;
  const avg = total ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / total) : 0;
  const payments: Payment[] = Array.isArray(paymentsQ.data) ? (paymentsQ.data as Payment[]) : [];
  const certs: Certificate[] = Array.isArray(certsQ.data) ? (certsQ.data as Certificate[]) : [];

  // activity heatmap moved to /activity page

  const openInvoice = (p: Payment) => {
    const amount = (p.amount / 100).toLocaleString("en-IN", { style: "currency", currency: p.currency || "INR" });
    const date = new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const invoiceNo = `QTNXT-${String(p.id).padStart(6, "0")}-${p.razorpay_payment_id.slice(-6).toUpperCase()}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title><style>body{font-family:Inter,system-ui;padding:32px;color:#18181b} .head{display:flex;justify-content:space-between;align-items:center} .logo{width:32px;height:32px;border-radius:999px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800} h1{font-size:22px;margin:0} table{width:100%;border-collapse:collapse;margin-top:24px} th,td{border:1px solid #e4e4e7;padding:10px;text-align:left;font-size:13px} th{background:#f4f4f5} .muted{color:#71717a;font-size:12px} .total{font-weight:800} @media print{button{display:none}}</style></head><body>
      <div class="head"><div style="display:flex;gap:10px;align-items:center"><div class="logo">Q</div><div><div style="font-weight:800">QTNXT</div><div class="muted">Learn skills that move you forward</div></div></div><div style="text-align:right"><div style="font-weight:800">Invoice</div><div class="muted">${invoiceNo}</div><div class="muted">${date}</div></div></div>
      <p class="muted">Billed to: ${user?.name || user?.email || user?.mobile} &lt;${user?.email || ""}&gt;</p>
      <table><tr><th>Course</th><th>Order ID</th><th>Payment ID</th><th>Amount</th></tr><tr><td>${p.course.title}</td><td style="font-family:monospace;font-size:11px">${p.razorpay_order_id}</td><td style="font-family:monospace;font-size:11px">${p.razorpay_payment_id}</td><td class="total">${amount}</td></tr></table>
      <p class="muted" style="margin-top:16px">Payment status: Paid • Thank you for learning with QTNXT.</p>
      <div style="margin-top:24px"><button onclick="window.print()" style="background:#0f172a;color:#fff;border:0;border-radius:999px;padding:10px 18px;font-weight:700;cursor:pointer">Print / Save as PDF</button></div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatar(r.result as string);
    r.readAsDataURL(f);
  };

  const save = async () => {
    let avatarUrl = avatar || "";
    // if a new file was picked, upload first to get a real URL (avatar is URLField)
    if (avatarFile) {
      setAvatarUploading(true);
      try {
        const uploaded = await uploadFile(avatarFile);
        avatarUrl = absoluteMediaUrl(uploaded.url) ?? uploaded.url;
        setAvatar(avatarUrl);
      } catch (err) {
        setToast(String(err));
        setTimeout(() => setToast(null), 2200);
        setAvatarUploading(false);
        return;
      }
      setAvatarUploading(false);
    } else if (avatar && avatar.startsWith("data:")) {
      // preview is still a data: URL (should not happen after upload flow) — don't send it
      avatarUrl = user?.avatar ?? "";
    }
    saveMut.mutate({
      name,
      email,
      age: age ? Number(age) : undefined,
      avatar: avatarUrl,
    });
  };

  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-[#f6f5f1]">
        <div className="px-3 pt-6 sm:px-4">
        <div className="mx-auto max-w-[1100px]">
          <div className="relative overflow-hidden rounded-[28px] bg-[#0f172a] p-6 text-white shadow-sm sm:p-8">
            <div className="absolute inset-0">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#1e3a5f] blur-[50px] opacity-60" />
              <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-amber-400/10 blur-[40px]" />
              <span className="absolute -bottom-6 -right-6 select-none text-[110px] font-black leading-none text-white/[0.04]">Q</span>
            </div>
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4 sm:gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] bg-zinc-800 shadow-lg sm:h-24 sm:w-24">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-bold">{user.name?.[0] ?? "?"}</span>}
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md ring-2 ring-[#0f172a]">✓</span>
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-900">LEARNER</span>
                    <span className="hidden text-xs text-white/40 sm:inline">• {user.mobile.slice(-4) ? `•••• ${user.mobile.slice(-4)}` : "QTNXT"}</span>
                  </div>
                  <h1 className="mt-2 text-[22px] font-black leading-tight tracking-tight sm:text-[26px]">{user.name || "Learner"}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-white/60">
                    <span className="truncate">{user.email || user.mobile}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>Age {user.age ?? "—"}</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditing((v) => !v)} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-zinc-900 shadow hover:bg-zinc-100">{editing ? "Cancel" : "Edit profile"}</button>
                    <Link to="/activity" className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/15">View activity →</Link>
                  </div>
                </div>
              </div>
              <div className="hidden text-right lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Member</p>
                <p className="mt-1 font-mono text-xs text-white/70">ID {String(user.mobile).slice(-6) || "QTNXT"}</p>
              </div>
            </div>
            <div className="relative mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Enrolled</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{total}</p>
                <p className="text-xs text-white/50">courses in progress</p>
              </div>
              <div className="border-l border-white/10 pl-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Completed</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{completed}</p>
                <p className="text-xs text-white/50">finished</p>
              </div>
              <div className="border-l border-white/10 pl-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">Avg. progress</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{avg}<span className="text-lg font-bold text-white/60">%</span></p>
                <p className="text-xs text-white/50">across all</p>
              </div>
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
                    <label className="rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-zinc-50">{avatarUploading ? "Uploading…" : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={onAvatarPicked} disabled={avatarUploading} /></label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={save} disabled={saveMut.isPending || avatarUploading} className="rounded-full bg-[#0f172a] px-5 py-2 text-xs font-bold text-white disabled:opacity-60">{saveMut.isPending || avatarUploading ? "Saving…" : "Save changes"}</button>
                <button onClick={()=> setEditing(false)} className="rounded-full border px-5 py-2 text-xs font-medium">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold">Account</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Email</p><p className="text-sm">{user.email || "—"}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Mobile</p><p className="text-sm">{user.mobile}</p></div>
                <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Role</p><p className="text-sm capitalize">{user.role ?? "Learner"}</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700"><AlertTriangle size={15} /> Danger zone</div>
                <p className="mt-1 text-xs text-red-600">Deleting your account permanently removes your profile and data from QTNXT.</p>
                {confirmDelete ? (
                  <div className="mt-3 rounded-lg bg-white p-3">
                    <p className="text-xs font-semibold text-zinc-700">Type <span className="font-mono font-bold">delete</span> to confirm:</p>
                    <div className="mt-2 flex gap-2">
                      <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" className="flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:bg-white" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); }}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                      >Cancel</button>
                      <button
                        onClick={() => deleteMut.mutate()}
                        disabled={deleteConfirmText !== "delete" || deleteMut.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteMut.isPending ? "Deleting…" : "Delete permanently"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="mt-2 flex items-center gap-1.5 rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 size={13} /> Delete account</button>
                )}
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

          <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white"><Receipt size={14} strokeWidth={2.5} /></span>
              <h2 className="text-sm font-bold">Payment activity</h2>
              <span className="ml-auto text-xs text-zinc-500">{payments.length} invoice{payments.length === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Invoices appear here after a successful payment (paid enrollments only).</p>
            {paymentsQ.isLoading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : payments.length === 0 ? (
              <div className="mt-4 rounded-2xl border bg-zinc-50 p-6 text-center text-sm text-zinc-500">No paid invoices yet — free enrollments don’t generate invoices.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {payments.map((p) => {
                  const amount = (p.amount / 100).toLocaleString("en-IN", { style: "currency", currency: p.currency || "INR" });
                  const date = new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                  const inv = `QTNXT-${String(p.id).padStart(6, "0")}`;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-zinc-50 p-3">
                      <img src={p.course.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-12 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold leading-tight">{p.course.title}</p>
                        <p className="text-xs text-zinc-500">{inv} • {date} • <span className="font-mono text-[11px]">{p.razorpay_payment_id.slice(0, 14)}…</span> • <span className="font-semibold text-emerald-600">Paid</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white border px-2.5 py-1 text-xs font-bold">{amount}</span>
                        <button onClick={() => openInvoice(p)} className="inline-flex items-center gap-1 rounded-full bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white hover:bg-black"><Download size={12} strokeWidth={2.5} /> Invoice</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-white"><Award size={14} strokeWidth={2.5} /></span>
              <h2 className="text-sm font-bold">Certificates Achieved</h2>
              <span className="ml-auto text-xs text-zinc-500">{certs.length} certificate{certs.length === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Professional QTNXT certificates issued after marking a course as complete and rating it.</p>
            {certsQ.isLoading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : certs.length === 0 ? (
              <div className="mt-4 rounded-2xl border bg-zinc-50 p-6 text-center text-sm text-zinc-500">No certificates yet — complete a course (100%) and rate it to earn your QTNXT certificate.</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {certs.map((c) => {
                  const enrollDate = new Date(c.enrolled_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                  const completeDate = new Date(c.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
                  return (
                    <div key={c.id} className="rounded-2xl border bg-zinc-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold leading-tight">{c.course.title}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{c.certificate_id}</p>
                        </div>
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">Certified</span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-zinc-600">
                        <p><span className="font-semibold">Learner:</span> {c.learner_name}</p>
                        <p><span className="font-semibold">Enrolled:</span> {enrollDate}</p>
                        <p><span className="font-semibold">Completed:</span> {completeDate}</p>
                      </div>
                      <button onClick={() => setViewCert(c)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white hover:bg-black"><Eye size={12} strokeWidth={2.5} /> View certificate</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {viewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-[720px] overflow-auto rounded-[20px] bg-white p-6 shadow-xl sm:p-8">
            <button onClick={() => setViewCert(null)} className="absolute right-4 top-4 rounded-full border bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50">Close</button>
            <div className="rounded-2xl border-[3px] border-[#0f172a] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-black text-white">Q</span>
                  <span className="text-sm font-black tracking-tight">QTNXT</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Certificate of Completion</span>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">This certifies that</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{viewCert.learner_name}</p>
                <p className="mx-auto mt-3 h-px w-24 bg-yellow-400" />
                <p className="mt-4 text-sm text-zinc-600">has successfully completed</p>
                <p className="mt-1 text-lg font-bold leading-tight sm:text-xl">{viewCert.course.title}</p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-left text-xs">
                  <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[10px] font-semibold uppercase text-zinc-500">Enrolled on</p><p className="mt-1 font-medium">{new Date(viewCert.enrolled_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
                  <div className="rounded-xl bg-zinc-50 p-3"><p className="text-[10px] font-semibold uppercase text-zinc-500">Completed on</p><p className="mt-1 font-medium">{new Date(viewCert.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4 text-left">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Certificate ID</p><p className="font-mono text-xs font-bold">{viewCert.certificate_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif italic text-sm">QTNXT Academy</p><p className="text-[10px] text-zinc-500">Verified • qtnxt.com/verify/{viewCert.certificate_id}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  <button onClick={() => window.print()} className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-bold text-white hover:bg-black">Print / Save PDF</button>
                  <button onClick={() => setViewCert(null)} className="rounded-full border px-4 py-2 text-xs font-medium">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
      </div>
    </>
  );
}