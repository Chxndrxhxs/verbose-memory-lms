import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AGE_MSG, User, ArrowRight, Trash2, AlertTriangle, Download, Receipt, Award, Eye, AVATAR_SIZE_MSG, isAvatarSizeAllowed, isValidAge, isValidEmail, isValidName, NAME_MSG } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { CertificateView } from "../components/CertificateView";
import { useAuth } from "../hooks/useAuth";
import { absoluteMediaUrl, api, uploadFile } from "../lib/api";
import { useMyCourses } from "../hooks/useMyCourses";
import { buildInvoiceHtml } from "../lib/invoice";
import { Button } from "../components/Button";
import { Input } from "../components/Controls";
import { Panel } from "../components/Panel";
import { Badge } from "../components/Badge";
import { Toast } from "../components/Toast";

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
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const enrollmentsQ = useMyCourses();

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
    const tail = (p.razorpay_payment_id ?? "000000").slice(-6).toUpperCase();
    const html = buildInvoiceHtml({
      invoiceNo: `QTNXT-${String(p.id).padStart(6, "0")}-${tail}`,
      dateLabel: date,
      billedTo: user?.name || user?.email || user?.mobile,
      email: user?.email || "",
      courseTitle: p.course.title,
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      amountLabel: amount,
    });
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isAvatarSizeAllowed(f)) {
      setAvatarError(AVATAR_SIZE_MSG);
      setAvatarFile(null);
      e.target.value = "";
      return;
    }
    setAvatarError(null);
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatar(r.result as string);
    r.readAsDataURL(f);
  };

  const save = async () => {
    const errors: Record<string, string> = {};
    if (!isValidName(name)) errors.name = NAME_MSG;
    if (!isValidEmail(email)) errors.email = "Valid email required";
    if (!isValidAge(age)) errors.age = AGE_MSG;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast("Please fix the highlighted fields");
      setTimeout(() => setToast(null), 2200);
      return;
    }

    let avatarUrl = avatar || "";
    // if a new file was picked, upload first to get a real URL (avatar is URLField)
    if (avatarFile) {
      setAvatarUploading(true);
      try {
        const uploaded = await uploadFile(avatarFile, "avatar");
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
      <div className="min-h-screen bg-room">
        <div className="px-4 pt-6 sm:px-6">
        <main id="main" className="mx-auto max-w-[1100px]">
          <div className="relative overflow-hidden border border-ink bg-room-deep p-6 text-ink-inverse sm:p-8">
            <div className="absolute inset-0">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-ink-inverse/[0.05] blur-[50px]" />
              <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gold/10 blur-[40px]" />
              <span className="absolute -bottom-6 -right-6 select-none text-[110px] font-semibold leading-none text-ink-inverse/[0.04]">Q</span>
            </div>
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4 sm:gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ink-inverse/20 bg-room-raised sm:h-24 sm:w-24">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-ink">{user.name?.[0] ?? "?"}</span>}
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center bg-live text-[10px] font-semibold text-ink-inverse ring-2 ring-room-deep">✓</span>
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">Learner</span>
                    <span className="tnum hidden text-xs text-ink-inverse/40 sm:inline">• {user.mobile.slice(-4) ? `•••• ${user.mobile.slice(-4)}` : "QTNXT"}</span>
                  </div>
                  <h1 className="mt-2 text-[22px] font-semibold leading-tight sm:text-[26px]">{user.name || "Learner"}</h1>
                  <p className="tnum mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-inverse/60">
                    <span className="truncate">{user.email || user.mobile}</span>
                    <span className="h-1 w-1 rounded-full bg-ink-inverse/20" />
                    <span>Age {user.age ?? "—"}</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="gold" size="sm" onClick={() => setEditing((v) => !v)}>{editing ? "Cancel" : "Edit profile"}</Button>
                    <Link to="/activity" className="inline-flex h-8 items-center border border-ink-inverse/25 bg-ink-inverse/10 px-3 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink-inverse/15">View activity →</Link>
                  </div>
                </div>
              </div>
              <div className="hidden text-right lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverse/40">Member</p>
                <p className="tnum mt-1 font-mono text-xs text-ink-inverse/70">ID {String(user.mobile).slice(-6) || "QTNXT"}</p>
              </div>
            </div>
            <div className="relative mt-8 grid grid-cols-3 gap-6 border-t border-ink-inverse/10 pt-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverse/40">Enrolled</p>
                <p className="tnum mt-1 text-3xl font-semibold">{total}</p>
                <p className="text-xs text-ink-inverse/50">courses in progress</p>
              </div>
              <div className="border-l border-ink-inverse/10 pl-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverse/40">Completed</p>
                <p className="tnum mt-1 text-3xl font-semibold">{completed}</p>
                <p className="text-xs text-ink-inverse/50">finished</p>
              </div>
              <div className="border-l border-ink-inverse/10 pl-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverse/40">Avg. progress</p>
                <p className="tnum mt-1 text-3xl font-semibold">{avg}<span className="text-lg font-semibold text-ink-inverse/60">%</span></p>
                <p className="text-xs text-ink-inverse/50">across all</p>
              </div>
            </div>
          </div>

          {editing && (
            <Panel className="mt-4 p-6 sm:p-8">
              <h2 className="text-sm font-semibold text-ink">Edit profile</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="pf-name" className="text-xs font-semibold text-ink-muted">Name</label><Input id="pf-name" value={name} onChange={(e)=> setName(e.target.value)} className="mt-1.5" />{fieldErrors.name && <p role="alert" className="mt-1 text-xs text-halt">{fieldErrors.name}</p>}</div>
                <div><label htmlFor="pf-email" className="text-xs font-semibold text-ink-muted">Email</label><Input id="pf-email" value={email} onChange={(e)=> setEmail(e.target.value)} type="email" className="mt-1.5" />{fieldErrors.email && <p role="alert" className="mt-1 text-xs text-halt">{fieldErrors.email}</p>}</div>
                <div><label htmlFor="pf-age" className="text-xs font-semibold text-ink-muted">Age</label><Input id="pf-age" value={age} onChange={(e)=> setAge(e.target.value)} type="number" inputMode="numeric" className="tnum mt-1.5" />{fieldErrors.age && <p role="alert" className="mt-1 text-xs text-halt">{fieldErrors.age}</p>}</div>
                <div>
                  <label htmlFor="pf-avatar" className="text-xs font-semibold text-ink-muted">Avatar</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-rule bg-room-sunk">
                      {avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" /> : <span className="flex h-full w-full items-center justify-center text-xs"><User size={20} className="text-ink-faint" aria-hidden /></span>}
                    </div>
                    <label htmlFor="pf-avatar" className="cursor-pointer border border-rule px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-room-sunk">{avatarUploading ? "Uploading…" : "Upload"}<input id="pf-avatar" type="file" accept="image/*" className="hidden" onChange={onAvatarPicked} disabled={avatarUploading} /></label>
                  </div>
                  {avatarError && <p role="alert" className="mt-1 text-xs text-halt">{avatarError}</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="primary" size="sm" onClick={save} disabled={saveMut.isPending || avatarUploading}>{saveMut.isPending || avatarUploading ? "Saving…" : "Save changes"}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={()=> setEditing(false)}>Cancel</Button>
              </div>
            </Panel>
          )}

          <div className="mt-4">
            <Panel className="p-6">
              <h2 className="text-sm font-semibold text-ink">Account</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="border border-rule bg-room-sunk p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Email</p><p className="text-sm text-ink">{user.email || "—"}</p></div>
                <div className="border border-rule bg-room-sunk p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Mobile</p><p className="tnum text-sm text-ink">{user.mobile}</p></div>
                <div className="border border-rule bg-room-sunk p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Role</p><p className="text-sm capitalize text-ink">{user.role ?? "Learner"}</p></div>
              </div>
              <div className="mt-4 border border-halt/25 bg-halt-soft p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-halt"><AlertTriangle size={15} aria-hidden /> Danger zone</div>
                <p className="mt-1 text-xs text-halt">Deleting your account permanently removes your profile and data from QTNXT.</p>
                {confirmDelete ? (
                  <div className="mt-3 border border-halt/25 bg-room-raised p-3">
                    <p className="text-xs font-semibold text-ink">Type <span className="font-mono font-semibold">delete</span> to confirm:</p>
                    <div className="mt-2 flex gap-2">
                      <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" aria-label="Type delete to confirm" className="flex-1 text-xs" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); }}
                      >Cancel</Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMut.mutate()}
                        disabled={deleteConfirmText !== "delete" || deleteMut.isPending}
                      >
                        {deleteMut.isPending ? "Deleting…" : "Delete permanently"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)} className="mt-2"><Trash2 size={13} aria-hidden /> Delete account</Button>
                )}
              </div>
            </Panel>
          </div>

          <Panel className="mt-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">My courses</h2>
              <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-4 hover:text-ink-muted">Browse <ArrowRight size={12} strokeWidth={2.5} aria-hidden /></Link>
            </div>
            {enrollmentsQ.isLoading ? <p className="mt-3 text-sm text-ink-muted">Loading…</p> : total === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No enrollments yet. <Link to="/courses" className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-4">Browse courses <ArrowRight size={12} strokeWidth={2.5} aria-hidden /></Link></p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {enrollments.map((e) => (
                  <Link key={e.id} to={`/courses/${e.course.id}`} className="flex gap-3 border border-rule bg-room-sunk p-3 transition-colors hover:bg-rule/40">
                    <img src={e.course.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-16 w-20 border border-rule object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight text-ink">{e.course.title}</p>
                      <p className="text-xs text-ink-muted">by {e.course.instructor_name}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden bg-rule/50"><div className="h-full bg-gold" style={{ width: `${e.progress}%` }} /></div>
                      <p className="tnum mt-1 text-[10px] text-ink-muted">{e.progress}% complete</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="mt-4 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center bg-ink text-ink-inverse"><Receipt size={14} strokeWidth={2.5} aria-hidden /></span>
              <h2 className="text-sm font-semibold text-ink">Payment activity</h2>
              <span className="tnum ml-auto text-xs text-ink-muted">{payments.length} invoice{payments.length === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">Invoices appear here after a successful payment (paid enrollments only).</p>
            {paymentsQ.isLoading ? <p className="mt-3 text-sm text-ink-muted">Loading…</p> : payments.length === 0 ? (
              <div className="mt-4 border border-rule bg-room-sunk p-6 text-center text-sm text-ink-muted">No paid invoices yet — free enrollments don’t generate invoices.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {payments.map((p) => {
                  const amount = (p.amount / 100).toLocaleString("en-IN", { style: "currency", currency: p.currency || "INR" });
                  const date = new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                  const inv = `QTNXT-${String(p.id).padStart(6, "0")}`;
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 border border-rule bg-room-sunk p-3">
                      <img src={p.course.cover_image || "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&auto=format&fit=crop&q=80"} alt="" className="h-12 w-16 border border-rule object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight text-ink">{p.course.title}</p>
                        <p className="tnum text-xs text-ink-muted">{inv} • {date} • <span className="font-mono text-[11px]">{p.razorpay_payment_id.slice(0, 14)}…</span> • <span className="font-semibold text-live">Paid</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tnum border border-rule bg-room-raised px-2.5 py-1 text-xs font-semibold text-ink">{amount}</span>
                        <Button type="button" variant="primary" size="sm" onClick={() => openInvoice(p)}><Download size={12} strokeWidth={2.5} aria-hidden /> Invoice</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel className="mt-4 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center bg-gold text-ink"><Award size={14} strokeWidth={2.5} aria-hidden /></span>
              <h2 className="text-sm font-semibold text-ink">Certificates Achieved</h2>
              <span className="tnum ml-auto text-xs text-ink-muted">{certs.length} certificate{certs.length === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">Professional QTNXT certificates issued after marking a course as complete and rating it.</p>
            {certsQ.isLoading ? <p className="mt-3 text-sm text-ink-muted">Loading…</p> : certs.length === 0 ? (
              <div className="mt-4 border border-rule bg-room-sunk p-6 text-center text-sm text-ink-muted">No certificates yet — complete a course (100%) and rate it to earn your QTNXT certificate.</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {certs.map((c) => {
                  const enrollDate = new Date(c.enrolled_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                  const completeDate = new Date(c.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
                  return (
                    <div key={c.id} className="border border-rule bg-room-sunk p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight text-ink">{c.course.title}</p>
                          <p className="mt-1 font-mono text-[11px] text-ink-muted">{c.certificate_id}</p>
                        </div>
                        <Badge tone="gold" showIcon={false} className="text-[10px]">Certified</Badge>
                      </div>
                      <div className="tnum mt-3 space-y-1 text-xs text-ink-muted">
                        <p><span className="font-semibold text-ink">Learner:</span> {c.learner_name}</p>
                        <p><span className="font-semibold text-ink">Enrolled:</span> {enrollDate}</p>
                        <p><span className="font-semibold text-ink">Completed:</span> {completeDate}</p>
                      </div>
                      <Button type="button" variant="primary" size="sm" onClick={() => setViewCert(c)} className="mt-3"><Eye size={12} strokeWidth={2.5} aria-hidden /> View certificate</Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/certificates/${c.certificate_id}`
                          );
                          setToast("Certificate link copied");
                        }}
                      >
                        Copy link
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </main>
      </div>
      {viewCert && (
        <CertificateView
          learnerName={viewCert.learner_name}
          courseTitle={viewCert.course.title}
          enrolledLabel={new Date(viewCert.enrolled_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          issuedLabel={new Date(viewCert.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          certificateId={viewCert.certificate_id}
          onClose={() => setViewCert(null)}
        />
      )}
        {toast && <Toast>{toast}</Toast>}
      </div>
    </>
  );
}