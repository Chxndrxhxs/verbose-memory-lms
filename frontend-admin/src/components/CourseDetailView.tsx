import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, Play, Trash2 } from "@masterlms/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AdminCourseDetailResponse } from "../types/admin";
import { cn } from "../lib/utils";
import { Card, CardHeader } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";
import type { CourseEditValues } from "../containers/CourseDetail.container";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().max(255),
  category: z.string().min(1, "Category is required").max(50),
  description: z.string(),
  price: z
    .string()
    .regex(/^\d{0,7}(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => v === "" || Number(v) > 0, "Price must be greater than 0"),
  pricing_type: z.enum(["free", "one_time"]),
  cover_image: z.string().url("Enter a valid URL").or(z.literal("")),
  status: z.enum(["draft", "published"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  what_you_will_learn: z.string(),
});

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const kindStyles: Record<string, string> = {
  video: "bg-violet-100 text-violet-700",
  resource: "bg-blue-100 text-blue-700",
  quiz: "bg-amber-100 text-amber-700",
};

export function CourseDetailView({
  id,
  data,
  loading,
  error,
  initial,
  onSave,
  saving,
  saveError,
  toggling,
  onToggle,
  onDelete,
  deleting,
}: {
  id: number;
  data?: AdminCourseDetailResponse;
  loading: boolean;
  error: string | null;
  initial?: CourseEditValues;
  onSave: (v: CourseEditValues) => void;
  saving: boolean;
  saveError: string | null;
  toggling: boolean;
  onToggle: (status: "draft" | "published") => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  const form = useForm<CourseEditValues>({ resolver: zodResolver(schema), defaultValues: initial ?? {} });
  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-6 w-40 rounded bg-zinc-200" /><div className="h-48 rounded-2xl bg-zinc-100" /></div>;
  if (error || !data) return <div className="text-sm text-red-600">{error}</div>;
  const c = data.course;
  const sections = data.sections;

  const submit = form.handleSubmit((v) => {
    onSave(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  const pricing = form.watch("pricing_type");

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft size={15} strokeWidth={2.5} /> Back to courses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">{c.title}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
              {c.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            #{id} · by {c.instructor_name} · {c.category} · {c.level}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggle(c.status === "published" ? "draft" : "published")}
            disabled={toggling}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {c.status === "published" ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
            {c.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={14} strokeWidth={2.5} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Edit course"
            subtitle="Content, pricing and visibility."
            action={
              <button onClick={() => form.reset()} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">Reset</button>
            }
          />
          <form onSubmit={submit} className="space-y-4">
            <Field label="Title"><input className={inputCls} {...form.register("title")} /></Field>
            {form.formState.errors.title && <p className="-mt-3 text-xs text-red-600">{form.formState.errors.title.message}</p>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subtitle"><input className={inputCls} {...form.register("subtitle")} /></Field>
              <Field label="Category"><input className={inputCls} placeholder="e.g. Programming" {...form.register("category")} /></Field>
            </div>
            {form.formState.errors.category && <p className="-mt-3 text-xs text-red-600">{form.formState.errors.category.message}</p>}
            <Field label="Description"><textarea rows={3} className={inputCls} {...form.register("description")} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pricing type">
                <select className={inputCls} {...form.register("pricing_type")}>
                  <option value="free">Free</option>
                  <option value="one_time">One-time paid</option>
                </select>
              </Field>
              <Field label={`Price (₹)${pricing === "free" ? " — free" : ""}`}>
                <input className={inputCls} inputMode="decimal" placeholder="499" {...form.register("price")} />
              </Field>
            </div>
            {form.formState.errors.price && <p className="-mt-3 text-xs text-red-600">{form.formState.errors.price.message}</p>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Level">
                <select className={inputCls} {...form.register("level")}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} {...form.register("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
            </div>
            <Field label="Cover image URL"><input className={inputCls} placeholder="https://…" {...form.register("cover_image")} /></Field>
            {form.formState.errors.cover_image && <p className="-mt-3 text-xs text-red-600">{form.formState.errors.cover_image.message}</p>}
            <Field label="What you will learn (one per line)">
              <textarea rows={4} className={inputCls} {...form.register("what_you_will_learn")} />
            </Field>

            {c.cover_image && (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-2">
                <img src={c.cover_image} alt="" className="h-12 w-20 rounded-lg object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                <p className="truncate text-xs text-zinc-400">Current cover</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving || saved} className="rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Check size={14} strokeWidth={3} /> Saved</span>}
              {saveError && <span className="text-xs font-semibold text-red-600">{saveError}</span>}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Stats" />
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Students", c.student_count],
                ["Sections", c.section_count],
                ["Lessons", c.lesson_count],
                ["Rating", `${Number(c.average_rating).toFixed(1)} ★ (${c.rating_count ?? 0})`],
                ["Instructor", c.instructor_name],
                ["ID", `#${id}`],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-zinc-100 pb-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{k}</dt>
                  <dd className="mt-0.5 truncate font-medium text-zinc-800">{String(v)}</dd>
                </div>
              ))}
            </div>
            <p className="mt-3 truncate rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-400">/{c.slug}</p>
          </Card>

          <Card>
            <CardHeader title={`Content · ${sections.length} sections`} />
            {sections.length === 0 ? (
              <p className="py-4 text-sm text-zinc-400">No sections yet.</p>
            ) : (
              <div className="space-y-3">
                {sections.map((s) => (
                  <div key={s.id} className="rounded-xl border border-zinc-100">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-sm font-semibold text-zinc-800">
                        <span className="mr-1.5 text-xs text-zinc-400">{s.order}.</span>
                        {s.title}
                      </p>
                      <span className="text-xs text-zinc-400">{s.lessons.length} lesson{s.lessons.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="divide-y border-t">
                      {s.lessons.map((l) => (
                        <div key={l.id} className="flex items-center gap-2.5 px-3 py-1.5">
                          <Play size={12} className="text-zinc-300" strokeWidth={2.5} />
                          <p className="flex-1 truncate text-xs text-zinc-600">{l.title}</p>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", kindStyles[l.kind] ?? "bg-zinc-100 text-zinc-500")}>
                            {l.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this course?"
        description={`Permanently remove "${c.title}" and all its sections and lessons? Learner enrollments in it will also be removed. This cannot be undone.`}
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