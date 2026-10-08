import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Play,
  Trash2,
  isValidTitle,
  isImageUrl,
} from "@masterlms/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AdminCourseDetailResponse } from "../types/admin";
import { Panel, PanelHeader } from "./Panel";
import { Badge, statusTone } from "./Badge";
import { Button } from "./Button";
import { DefinitionList, Field, Input, Select, Textarea } from "./Controls";
import { GridMessage } from "./DataGrid";
import { ConfirmDialog } from "./ConfirmDialog";
import type { CourseEditValues } from "../containers/CourseDetail.container";

const schema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer")
    .refine(
      (v) => v.trim() === "" || isValidTitle(v),
      "Title must be a real phrase — no long symbol runs or random characters",
    ),
  subtitle: z.string().max(255),
  category: z.string().min(1, "Category is required").max(50),
  description: z.string(),
  price: z
    .string()
    .regex(/^\d{0,7}(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => v === "" || Number(v) > 0, "Price must be greater than 0"),
  pricing_type: z.enum(["free", "one_time"]),
  cover_image: z
    .string()
    .refine(
      (v) => v.trim() === "" || (isImageUrl(v) && /^https?:\/\//i.test(v.trim())),
      "Cover image must be a valid image URL",
    ),
  status: z.enum(["draft", "published"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  what_you_will_learn: z.string(),
});

const LESSON_TONE: Record<string, "flight" | "live" | "hold"> = {
  video: "flight",
  resource: "live",
  quiz: "hold",
};

export function CourseDetailView({
  id,
  data,
  loading,
  error,
  initial,
  categorySuggestions,
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
  categorySuggestions?: string[];
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

  if (loading)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading course">
        <div className="h-4 w-28 animate-pulse bg-paper-sunk" />
        <div className="h-10 w-72 animate-pulse bg-paper-sunk" />
        <div className="h-96 animate-pulse border border-rule bg-paper-raised" />
      </div>
    );

  if (error || !data)
    return (
      <Panel>
        <GridMessage
          kind="error"
          title="Could not load this course"
          body={error ?? `No course was returned for id ${id}.`}
        />
      </Panel>
    );

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
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={2.5} aria-hidden /> Back to courses
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule-strong pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{c.title}</h1>
            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
          </div>
          <p className="tnum mt-1 text-sm text-ink-muted">
            #{id} · {c.instructor_name} · {c.category} · {c.level}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => onToggle(c.status === "published" ? "draft" : "published")}
            disabled={toggling}
          >
            {c.status === "published" ? (
              <EyeOff size={14} strokeWidth={2.5} aria-hidden />
            ) : (
              <Eye size={14} strokeWidth={2.5} aria-hidden />
            )}
            {c.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} strokeWidth={2.5} aria-hidden /> Delete
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            title="Edit course"
            meta="Content, pricing and visibility"
            action={
              <button
                onClick={() => form.reset()}
                className="text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                Reset
              </button>
            }
          />
          <form onSubmit={submit} className="space-y-4 p-5">
            <Field label="Title" error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subtitle" error={form.formState.errors.subtitle?.message}>
                <Input {...form.register("subtitle")} />
              </Field>
              <Field label="Category" error={form.formState.errors.category?.message}>
                <Input
                  placeholder="e.g. Programming"
                  list="course-category-suggestions"
                  {...form.register("category")}
                />
                {/* Suggests the categories already in use; free
                    text stays because new categories have no
                    management UI yet. */}
                <datalist id="course-category-suggestions">
                  {(categorySuggestions ?? []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea rows={3} {...form.register("description")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pricing type">
                <Select {...form.register("pricing_type")}>
                  <option value="free">Free</option>
                  <option value="one_time">One-time paid</option>
                </Select>
              </Field>
              <Field
                label="Price (₹)"
                hint={pricing === "free" ? "Not charged while the course is free" : undefined}
                error={form.formState.errors.price?.message}
              >
                <Input
                  inputMode="decimal"
                  placeholder="499"
                  disabled={pricing === "free"}
                  {...form.register("price")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Level">
                <Select {...form.register("level")}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select {...form.register("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Cover image URL"
              hint="A direct image link, 16:9 works best"
              error={form.formState.errors.cover_image?.message}
            >
              <Input placeholder="https://…" {...form.register("cover_image")} />
            </Field>

            <Field
              label="What you will learn"
              hint="One outcome per line"
              error={form.formState.errors.what_you_will_learn?.message}
            >
              <Textarea rows={4} {...form.register("what_you_will_learn")} />
            </Field>

            {c.cover_image && (
              <div className="flex items-center gap-3 border border-rule bg-paper p-2">
                <img
                  src={c.cover_image}
                  alt=""
                  className="h-11 w-20 shrink-0 object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <p className="truncate text-xs text-ink-faint">Current cover</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
              <Button type="submit" variant="primary" disabled={saving || saved}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-live">
                  <Check size={14} strokeWidth={3} aria-hidden /> Saved
                </span>
              )}
              {saveError && <span className="text-xs font-semibold text-halt">{saveError}</span>}
            </div>
          </form>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <Panel flush>
            <PanelHeader title="At a glance" />
            <div className="p-5">
              <DefinitionList
                items={[
                  ["Students", <span className="tnum">{c.student_count}</span>],
                  ["Sections", <span className="tnum">{c.section_count}</span>],
                  ["Lessons", <span className="tnum">{c.lesson_count}</span>],
                  [
                    "Rating",
                    <span className="tnum">
                      {Number(c.average_rating).toFixed(1)} ({c.rating_count ?? 0})
                    </span>,
                  ],
                  ["Slug", `/${c.slug}`],
                ]}
              />
            </div>
          </Panel>

          <Panel flush>
            <PanelHeader
              title="Content"
              meta={`${sections.length} sections`}
            />
            {sections.length === 0 ? (
              <GridMessage
                kind="empty"
                title="No sections yet"
                body="Sections and lessons are authored in the instructor console, and appear here once saved."
              />
            ) : (
              <ul className="divide-y divide-rule">
                {sections.map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium text-ink">
                        <span className="tnum mr-1.5 text-xs text-ink-faint">{s.order}.</span>
                        {s.title}
                      </p>
                      <span className="tnum shrink-0 text-xs text-ink-faint">
                        {s.lessons.length}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {s.lessons.map((l) => (
                        <li key={l.id} className="flex items-center gap-2.5">
                          <Play size={11} className="shrink-0 text-ink-faint" strokeWidth={2.5} aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                            {l.title}
                          </span>
                          <Badge tone={LESSON_TONE[l.kind] ?? "muted"} showIcon={false}>
                            {l.kind}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
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