import { Link } from "react-router-dom";
import { ArrowRight, Trash2, User } from "@masterlms/shared";
import type { SharedInstructorCourse as InstructorCourse } from "@masterlms/shared";
import { absoluteMediaUrl } from "../lib/api";
import { InstructorHeader } from "./InstructorHeader";
import { PageHeader, PageShell, Panel, PanelHeader } from "./Panel";
import { ListRows, ListRow, ListMessage } from "./DataGrid";
import { Badge, TeachMark, statusTone } from "./Badge";
import { Button } from "./Button";
import { Field, Input, Notice } from "./Controls";
import { Modal } from "./Modal";

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
  avatarError: string | null;
  fieldErrors: Record<string, string>;
  onSave: () => void;
  onDelete: () => void;
  onInvalidateCourses: () => void;
};

export function ProfileView(p: Props) {
  const { user, courses } = p;

  const total = courses.length;
  const published = courses.filter((c) => c.status === "published").length;
  const draft = total - published;
  const totalStudents = courses.reduce((a, c) => a + c.student_count, 0);
  const avgRating =
    courses.length
      ? (
          courses.reduce((a, c) => a + Number(c.average_rating || 0), 0) / courses.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Account"
            title="Your profile"
            description="What learners and admins see about you on QTNXT."
            action={
              p.editing ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={p.onCancelEditing}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={p.onSave} disabled={p.saving}>
                    {p.saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={p.onToggleEditing}>
                  Edit profile
                </Button>
              )
            }
          />

          {/* Identity block. Ink panel, squared, with the one signal mark. */}
          <Panel tone="sunk" className="flex flex-wrap items-center gap-5">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-16 w-16 shrink-0 object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-slate-sunk text-ink-faint">
                <User size={26} strokeWidth={1.8} aria-hidden />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-ink">{user.name || "Unnamed instructor"}</h2>
                <TeachMark />
              </div>
              <p className="tnum mt-1 text-sm text-ink-muted">
                +91 {user.mobile}
                {user.email ? ` · ${user.email}` : " · no email on file"}
              </p>
            </div>

            <dl className="grid w-full grid-cols-2 gap-px border border-rule bg-rule sm:w-auto sm:grid-cols-4">
              {[
                ["Courses", total],
                ["Published", published],
                ["Drafts", draft],
                ["Learners", totalStudents],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-slate-panel px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    {k}
                  </dt>
                  <dd className="tnum mt-1 text-xl font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          {p.toast && (
            <Notice tone="live" role="status">
              {p.toast}
            </Notice>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title={p.editing ? "Edit details" : "Details"}
                subtitle={
                  p.editing
                    ? "Learners see your name and email on every course you publish."
                    : "Public information attached to your published courses."
                }
              />

              {p.editing ? (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    p.onSave();
                  }}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-ink-muted">Profile photo</span>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={p.onAvatarPicked}
                        className="mt-1.5 block w-full max-w-[280px] text-xs text-ink-muted file:mr-3 file:border file:border-rule file:bg-slate-panel file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
                      />
                      <p className="mt-1.5 text-xs text-ink-faint">
                        {p.avatarUploading ? "Uploading…" : "JPG or PNG, up to 2 MB"}
                      </p>
                      {p.avatarError && (
                        <p className="mt-1 text-xs font-medium text-halt">{p.avatarError}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="name" error={p.fieldErrors.name}>
                      <Input
                        id="name"
                        value={p.name}
                        onChange={(e) => p.onName(e.target.value)}
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Email" htmlFor="email" error={p.fieldErrors.email}>
                      <Input
                        id="email"
                        type="email"
                        value={p.email}
                        onChange={(e) => p.onEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Age"
                    htmlFor="age"
                    hint="Required. Learners must be at least 18 to enrol."
                    error={p.fieldErrors.age}
                  >
                    <Input
                      id="age"
                      inputMode="numeric"
                      value={p.age}
                      onChange={(e) => p.onAge(e.target.value)}
                      placeholder="e.g. 31"
                      className="max-w-[160px]"
                    />
                  </Field>

                  <div className="flex items-center gap-2 border-t border-rule pt-4">
                    <Button type="submit" variant="primary" disabled={p.saving}>
                      {p.saving ? "Saving…" : "Save changes"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={p.onCancelEditing}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                  {[
                    ["Full name", user.name || "—"],
                    ["Email", user.email || "No email on file"],
                    ["Mobile", `+91 ${user.mobile}`],
                    ["Age", user.age == null ? "—" : String(user.age)],
                    ["Average rating", avgRating],
                    ["Role", user.role ?? "instructor"],
                  ].map(([k, v]) => (
                    <div key={k} className="border-b border-rule pb-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        {k}
                      </dt>
                      <dd className="mt-1 truncate text-sm font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panel>

            <div className="space-y-6">
              <Panel flush>
                <PanelHeader className="border-b border-rule px-5 py-3" title="Danger zone" />
                <div className="space-y-3 p-5">
                  <Notice tone="warn">
                    Deleting your account removes your courses, enrolments and unpaid drafts.
                    Paid orders are retained for accounting. This cannot be undone.
                  </Notice>
                  <Button variant="danger" onClick={p.onConfirmDeleteOpen}>
                    <Trash2 size={15} strokeWidth={2.25} aria-hidden />
                    Delete my account
                  </Button>
                </div>
              </Panel>
            </div>
          </div>

          <Panel flush>
            <PanelHeader
              className="border-b border-rule px-5 py-3"
              title="Your courses"
              meta={`${total} total`}
              action={
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  Manage all <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
                </Link>
              }
            />
            {p.loading ? (
              <p className="px-5 py-8 text-center text-sm text-ink-faint">Loading your courses…</p>
            ) : courses.length === 0 ? (
              <ListMessage
                kind="empty"
                title="No courses yet"
                body="Your published and draft courses will be listed here so you can jump straight back into editing one."
                action={
                  <Link
                    to="/courses/create"
                    className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                  >
                    Create your first course
                  </Link>
                }
              />
            ) : (
              <ListRows>
                {courses.map((c) => {
                  const cover = c.cover_image ? absoluteMediaUrl(c.cover_image) : null;
                  return (
                  <ListRow key={c.id}>
                    <div className="h-11 w-16 shrink-0 overflow-hidden border border-rule bg-slate-sunk">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span aria-hidden className="block h-full w-full bg-rule/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/courses/${c.id}`}
                        className="block max-w-[320px] truncate text-sm font-medium text-ink hover:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="tnum truncate text-xs text-ink-faint">
                        {c.student_count} {c.student_count === 1 ? "learner" : "learners"} · rated{" "}
                        {Number(c.average_rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </ListRow>
                  );
                })}
              </ListRows>
            )}
          </Panel>
        </div>
      </PageShell>

      <Modal
        open={p.confirmDelete}
        onClose={p.onConfirmDeleteClose}
        title="Delete your account?"
        description="This removes your profile, courses and enrolments. Paid orders are kept for accounting. This cannot be undone."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={p.onConfirmDeleteClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={p.deleteConfirmText !== "delete" || p.deleting}
              onClick={p.onDelete}
            >
              {p.deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        }
      >
        <Field
          label="Type delete to confirm"
          htmlFor="delete-confirm"
          hint="This confirms you understand the account cannot be recovered."
        >
          <Input
            id="delete-confirm"
            value={p.deleteConfirmText}
            onChange={(e) => p.onDeleteConfirmText(e.target.value)}
            placeholder="delete"
            autoComplete="off"
          />
        </Field>
      </Modal>
    </div>
  );
}