import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ageField,
  ArrowLeft,
  Check,
  cityField,
  emailField,
  MAX_AGE,
  MIN_AGE,
  nameField,
  Trash2,
  User,
} from "@masterlms/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AdminUserDetail } from "../types/admin";
import { Panel, PanelHeader } from "./Panel";
import { Badge, RoleBadge, statusTone } from "./Badge";
import { Button } from "./Button";
import { DefinitionList, Field, Input, Select } from "./Controls";
import {
  GridHead,
  GridMessage,
  GridPanel,
  GridScroll,
  Td,
  Th,
  Tr,
} from "./DataGrid";
import { ConfirmDialog } from "./ConfirmDialog";
import type { UserEditValues } from "../containers/UserDetail.container";

const schema = z.object({
  first_name: nameField("First name"),
  last_name: nameField("Last name"),
  email: emailField("Email"),
  role: z.enum(["learner", "instructor", "admin"]),
  city: cityField("City"),
  // Age is required: clearing it persisted a blank that then showed up as
  // missing in the instructor module (RAM-42).
  age: ageField(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
  is_mobile_verified: z.boolean(),
});

const FLAGS = [
  ["is_active", "Active, can sign in"],
  ["is_staff", "Staff"],
  ["is_superuser", "Superuser"],
  ["is_mobile_verified", "Mobile verified"],
] as const;

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
  avatarPreview,
  avatarFile,
  avatarError,
  onAvatarPicked,
}: {
  data?: AdminUserDetail;
  loading: boolean;
  error: string | null;
  initial?: UserEditValues;
  onSave: (v: UserEditValues) => void | Promise<unknown>;
  saving: boolean;
  saveError: string | null;
  onDelete: () => void;
  deleting: boolean;
  avatarPreview?: string | null;
  avatarFile?: File | null;
  avatarError?: string | null;
  onAvatarPicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noChanges, setNoChanges] = useState(false);

  const form = useForm<UserEditValues>({ resolver: zodResolver(schema), defaultValues: initial ?? {} });
  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  if (loading)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading user">
        <div className="h-4 w-28 animate-pulse bg-paper-sunk" />
        <div className="h-16 w-80 animate-pulse bg-paper-sunk" />
        <div className="h-96 animate-pulse border border-rule bg-paper-raised" />
      </div>
    );

  if (error || !data)
    return (
      <Panel>
        <GridMessage
          kind="error"
          title="Could not load this user"
          body={error ?? "No user data was returned."}
        />
      </Panel>
    );

  const u = data.user;

  const submit = form.handleSubmit(async (v) => {
    setNoChanges(false);
    if (initial) {
      const same =
        (v.first_name ?? "").trim() === (initial.first_name ?? "").trim() &&
        (v.last_name ?? "").trim() === (initial.last_name ?? "").trim() &&
        (v.email ?? "").trim() === (initial.email ?? "").trim() &&
        v.role === initial.role &&
        (v.city ?? "").trim() === (initial.city ?? "").trim() &&
        (v.age ?? "").trim() === (initial.age ?? "").trim() &&
        v.is_active === initial.is_active &&
        v.is_staff === initial.is_staff &&
        v.is_superuser === initial.is_superuser &&
        v.is_mobile_verified === initial.is_mobile_verified;
      if (same) {
        setNoChanges(true);
        return;
      }
    }
    try {
      await onSave(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // saveError prop surfaces the failure; don't show "Saved"
    }
  });

  return (
    <div className="space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={2.5} aria-hidden /> Back to users
      </Link>

      <header className="flex flex-wrap items-center gap-4 border-b border-rule-strong pb-4">
        <label
          htmlFor="user-avatar-input"
          className="block h-14 w-14 shrink-0 cursor-pointer overflow-hidden border border-rule"
          title="Change photo"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : u.avatar ? (
            <img src={u.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-paper-sunk text-ink-faint">
              <User size={22} strokeWidth={2} aria-hidden />
            </span>
          )}
        </label>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{u.name || u.username}</h1>
            <RoleBadge role={u.role} />
            {!u.is_active && <Badge tone="muted">inactive</Badge>}
          </div>
          <p className="tnum mt-1 text-sm text-ink-muted">
            @{u.username} · +91 {u.mobile} · {u.email || "No email"}
          </p>
        </div>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} strokeWidth={2.5} aria-hidden /> Delete user
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            title="Edit profile"
            meta="Role, contact and status"
            action={
              <button
                onClick={() => form.reset()}
                className="text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                Reset
              </button>
            }
          />
          <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.first_name?.message}>
              <Input {...form.register("first_name")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.last_name?.message}>
              <Input {...form.register("last_name")} />
            </Field>
            <Field
              label="Email"
              className="sm:col-span-2"
              error={form.formState.errors.email?.message}
            >
              <Input placeholder="user@example.com" {...form.register("email")} />
            </Field>
            <Field label="Role" error={form.formState.errors.role?.message}>
              <Select {...form.register("role")}>
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field label="City" error={form.formState.errors.city?.message}>
              <Input {...form.register("city")} />
            </Field>
            <Field
              label="Age"
              className="sm:col-span-2"
              hint={`Required. Allowed range: ${MIN_AGE} to ${MAX_AGE} years.`}
              error={form.formState.errors.age?.message}
            >
              <Input
                inputMode="numeric"
                placeholder={`e.g. ${25}`}
                {...form.register("age")}
              />
            </Field>

            <Field
              label="Avatar"
              className="sm:col-span-2"
              hint="Optional. Image, max 2 MB."
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-rule bg-paper-sunk">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={18} strokeWidth={2} className="text-ink-faint" aria-hidden />
                  )}
                </span>
                <label
                  htmlFor="user-avatar-input"
                  className="cursor-pointer border border-rule px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-paper-sunk"
                >
                  {avatarFile ? "Replace photo" : "Upload photo"}
                </label>
                <input
                  id="user-avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarPicked}
                />
              </div>
              {avatarError && (
                <p role="alert" className="mt-1 text-xs font-medium text-halt">{avatarError}</p>
              )}
            </Field>

            {FLAGS.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 border border-rule bg-paper px-3 py-2.5 sm:col-span-2"
              >
                <span className="text-sm text-ink">{label}</span>
                <input
                  type="checkbox"
                  {...form.register(key)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-ink)]"
                />
              </label>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4 sm:col-span-2">
              <Button type="submit" variant="primary" disabled={saving || saved}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-live">
                  <Check size={14} strokeWidth={3} aria-hidden /> Saved
                </span>
              )}
              {noChanges && (
                <span className="text-xs font-semibold text-hold">No changes made.</span>
              )}
              {saveError && <span className="text-xs font-semibold text-halt">{saveError}</span>}
            </div>
          </form>
        </Panel>

        <div className="lg:col-span-2">
          <Panel flush>
            <PanelHeader title="Account info" />
            <div className="p-5">
              <DefinitionList
                items={[
                  ["Username", `@${u.username}`],
                  ["City", u.city || "—"],
                  ["Age", u.age === null ? "—" : <span className="tnum">{u.age}</span>],
                  [
                    "Joined",
                    new Date(u.date_joined).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                  ],
                  ["User ID", <span className="tnum">#{u.id}</span>],
                ]}
              />
            </div>
          </Panel>
        </div>
      </div>

      <GridPanel>
        <div className="border-b border-rule bg-paper px-5 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            Enrollments{" "}
            <span className="tnum ml-2 font-normal text-ink-faint">{data.enrollments.length}</span>
          </h2>
        </div>
        {data.enrollments.length === 0 ? (
          <GridMessage
            kind="empty"
            title="No enrollments"
            body="This account has not joined any courses yet. Enrollments appear here the moment a learner starts one."
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Course</Th>
              <Th>Instructor</Th>
              <Th>Status</Th>
              <Th align="right">Progress</Th>
              <Th>Enrolled</Th>
            </GridHead>
            <tbody>
              {data.enrollments.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <Link
                      to={`/courses/${e.course_id}`}
                      className="block max-w-[280px] truncate text-sm font-medium text-ink hover:underline"
                    >
                      {e.course_title}
                    </Link>
                  </Td>
                  <Td className="text-ink-muted">{e.instructor}</Td>
                  <Td>
                    <Badge tone={statusTone(e.course_status)}>{e.course_status}</Badge>
                  </Td>
                  <Td align="right" className="tnum text-ink">
                    {e.progress}%
                  </Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">
                    {new Date(e.enrolled_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

      <GridPanel>
        <div className="border-b border-rule bg-paper px-5 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            Payments{" "}
            <span className="tnum ml-2 font-normal text-ink-faint">{data.payments.length}</span>
          </h2>
        </div>
        {data.payments.length === 0 ? (
          <GridMessage
            kind="empty"
            title="No payments"
            body="Nothing has been paid for by this account. Completed Razorpay orders appear here."
          />
        ) : (
          <GridScroll>
            <GridHead>
              <Th>Course</Th>
              <Th align="right">Amount</Th>
              <Th>Status</Th>
              <Th>Order</Th>
              <Th>Date</Th>
            </GridHead>
            <tbody>
              {data.payments.map((p) => (
                <Tr key={p.id}>
                  <Td className="max-w-[280px] truncate text-sm font-medium text-ink">
                    {p.course_title}
                  </Td>
                  <Td align="right" className="tnum whitespace-nowrap text-ink">
                    ₹{p.amount_inr.toLocaleString("en-IN")}
                  </Td>
                  <Td>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </Td>
                  <Td className="font-mono text-xs text-ink-muted">
                    {p.razorpay_order_id || "—"}
                  </Td>
                  <Td className="tnum whitespace-nowrap text-ink-muted">
                    {new Date(p.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </GridScroll>
        )}
      </GridPanel>

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