import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Trash2, User } from "@masterlms/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AdminRole, AdminUserDetail } from "../types/admin";
import { cn } from "../lib/utils";
import { Card, CardHeader } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";
import type { UserEditValues } from "../containers/UserDetail.container";

const schema = z.object({
  first_name: z.string().max(60),
  last_name: z.string().max(60),
  email: z.string().email().or(z.literal("")),
  role: z.enum(["learner", "instructor", "admin"]),
  city: z.string().max(60),
  age: z.string().regex(/^\d{0,3}$/, "Invalid age"),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
  is_mobile_verified: z.boolean(),
});

const ROLE_STYLES: Record<AdminRole, string> = {
  admin: "bg-[#0f172a] text-white",
  instructor: "bg-violet-100 text-violet-700",
  learner: "bg-emerald-100 text-emerald-700",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900";

export function UserDetailView({
  data,
  loading,
  error,
  initial,
  onSave,
  saving,
  saveError,
  onDelete,
  deleting,
}: {
  data?: AdminUserDetail;
  loading: boolean;
  error: string | null;
  initial?: UserEditValues;
  onSave: (v: UserEditValues) => void;
  saving: boolean;
  saveError: string | null;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  const form = useForm<UserEditValues>({ resolver: zodResolver(schema), defaultValues: initial ?? {} });
  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-6 w-40 rounded bg-zinc-200" /><div className="h-48 rounded-2xl bg-zinc-100" /></div>;
  if (error || !data) return <div className="text-sm text-red-600">{error}</div>;
  const u = data.user;

  const submit = form.handleSubmit((v) => {
    onSave(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  return (
    <div className="space-y-6">
      <Link to="/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={15} strokeWidth={2.5} /> Back to users
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        {u.avatar ? (
          <img src={u.avatar} alt="" className="h-14 w-14 rounded-2xl bg-zinc-200" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <User size={24} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">{u.name || u.username}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", ROLE_STYLES[u.role])}>{u.role}</span>
          </div>
          <p className="text-sm text-zinc-500">
            @{u.username} · +91 {u.mobile} · {u.email || "No email"}
          </p>
        </div>
        <button onClick={() => setConfirmDelete(true)} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
          <span className="inline-flex items-center gap-1.5"><Trash2 size={14} strokeWidth={2.5} /> Delete user</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Edit profile"
            subtitle="Role, contact and status flags."
            action={
              <button onClick={() => form.reset()} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                Reset
              </button>
            }
          />
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Field label="First name"><input className={inputCls} {...form.register("first_name")} /></Field>
            <Field label="Last name"><input className={inputCls} {...form.register("last_name")} /></Field>
            <div className="col-span-2">
              <Field label="Email"><input className={inputCls} placeholder="user@example.com" {...form.register("email")} /></Field>
              {form.formState.errors.email && <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>}
            </div>
            <Field label="Role">
              <select className={inputCls} {...form.register("role")}>
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="City"><input className={inputCls} {...form.register("city")} /></Field>
            <div className="col-span-2">
              <Field label="Age"><input className={inputCls} inputMode="numeric" {...form.register("age")} /></Field>
            </div>

            {([
              ["is_active", "Active (can log in)"],
              ["is_staff", "Staff"],
              ["is_superuser", "Superuser"],
              ["is_mobile_verified", "Mobile verified"],
            ] as const).map(([key, label]) => (
              <label key={key} className="col-span-2 flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5">
                <span className="text-sm text-zinc-700">{label}</span>
                <input type="checkbox" {...form.register(key)} className="h-4 w-4 accent-[#0f172a]" />
              </label>
            ))}

            <div className="col-span-2 flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving || saved} className="rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Check size={14} strokeWidth={3} /> Saved
                </span>
              )}
              {saveError && <span className="text-xs font-semibold text-red-600">{saveError}</span>}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Account info" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ["Username", `@${u.username}`],
                ["City", u.city || "—"],
                ["Age", u.age === null ? "—" : String(u.age)],
                ["Joined", new Date(u.date_joined).toDateString()],
                ["Created", new Date(u.date_joined).toLocaleTimeString()],
                ["ID", `#${u.id}`],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-zinc-100 pb-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{k}</dt>
                  <dd className="mt-0.5 font-medium text-zinc-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title={`Enrollments (${data.enrollments.length})`} />
        {data.enrollments.length === 0 ? (
          <p className="py-4 text-sm text-zinc-400">No enrollments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2 pr-4 font-semibold">Course</th>
                  <th className="py-2 pr-4 font-semibold">Instructor</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Progress</th>
                  <th className="py-2 font-semibold">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 pr-4">
                      <Link to={`/courses/${e.course_id}`} className="font-semibold text-zinc-800 hover:underline">{e.course_title}</Link>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-600">{e.instructor}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase", e.course_status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {e.course_status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-zinc-600">{e.progress}%</td>
                    <td className="py-2.5 text-zinc-500">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Payments (${data.payments.length})`} />
        {data.payments.length === 0 ? (
          <p className="py-4 text-sm text-zinc-400">No payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="py-2 pr-4 font-semibold">Course</th>
                  <th className="py-2 pr-4 font-semibold">Amount</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Order</th>
                  <th className="py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 font-semibold text-zinc-800">{p.course_title}</td>
                    <td className="py-2.5 pr-4 font-semibold text-zinc-700">₹{p.amount_inr.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase", p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500 font-mono">{p.razorpay_order_id || "—"}</td>
                    <td className="py-2.5 text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this user?"
        description={`Permanently remove ${u.name || u.username}? Their enrollments and payments are removed too. This cannot be undone.`}
        busy={deleting}
        onConfirm={() => {
          onDelete();
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}