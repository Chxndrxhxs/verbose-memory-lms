import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CourseBuilderHeader } from "../components/CourseBuilderHeader";
import { CourseCreateStep1 } from "../components/CourseCreateStep1";
import { CourseCreateStep2 } from "../components/CourseCreateStep2";
import { LessonTypePicker } from "../components/LessonTypePicker";
import { StudentPreviewModal } from "../components/StudentPreviewModal";
import { api, absoluteMediaUrl, uploadFile } from "../lib/api";
import { PublishChecklistModal } from "../components/PublishChecklistModal";
import type { Chapter, CourseStep1, Lesson, LessonKind } from "../types/courseCreate";

const step1Schema = z
  .object({
    title: z.string().trim().min(4, "At least 4 characters"),
    description: z.string().trim().min(10, "Add a short description"),
    pricingType: z.enum(["free", "one_time"]),
    price: z.string(),
    originalPrice: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.pricingType === "one_time" && Number(v.price) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Enter a price for paid course",
      });
    }
    if (
      v.pricingType === "one_time" &&
      Number(v.originalPrice) > 0 &&
      Number(v.price) > Number(v.originalPrice)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Selling price can't exceed MRP",
      });
    }
  });

const STEP_LABELS = ["Course details", "Build course"];

const initialState: CourseStep1 = {
  title: "",
  subtitle: "",
  description: "",
  whatYouWillLearn: "",
  pricingType: "free",
  price: "",
  originalPrice: "",
  pgFeesToLearner: false,
};

type LoadedCourse = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  what_you_will_learn?: string[];
  pricing_type: "free" | "one_time";
  price: string;
  original_price: string;
  pg_fees_to_learner: boolean;
  cover_image: string;
  sections?: {
    id: number;
    title: string;
    lessons: {
      id: number;
      title: string;
      kind: LessonKind;
      duration: string;
      resource_url: string;
      quiz_data: Lesson["quiz_data"];
    }[];
  }[];
};

function makeLesson(kind: LessonKind): Lesson {
  const base: Lesson = {
    id: `l${Date.now()}`,
    title: `New ${kind}`,
    kind,
    duration: kind === "video" || kind === "audio" ? "05:00" : "—",
    resource_url: "",
  };
  if (kind === "quiz") base.quiz_data = [{ id: `q${Date.now()}`, question: "", options: ["", ""], correct: 0 }];
  return base;
}

function StepIndicator({ step, canGoBuilder, onNavigate }: {
  step: number;
  canGoBuilder: boolean;
  onNavigate: (step: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Course setup steps"
      className="grid grid-cols-2 gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-sm"
    >
      {STEP_LABELS.map((label, i) => {
        const locked = i === 1 && !canGoBuilder;
        const active = step === i;
        return (
          <button
            key={label}
            role="tab"
            aria-selected={active}
            title={locked ? "Save course details first" : `Go to ${label}`}
            onClick={() => { if (!locked) onNavigate(i); }}
            disabled={locked}
            className={`flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? "bg-[#0f172a] text-white shadow" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function CourseCreateContainer({ existingId = "" }: { existingId?: string }) {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  // editing an existing course lands straight on content — details are one click back
  const [step, setStep] = useState(existingId ? 1 : 0);
  const [courseId, setCourseId] = useState<string | null>(existingId || null);
  const [values, setValues] = useState<CourseStep1>(initialState);
  const [errors, setErrors] = useState<Partial<Record<"title" | "description" | "price", string>>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; run: () => void } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const showToast = (msg: string, ms = 2500) => {
    setToast(msg);
    setToastAction(null);
    setTimeout(() => { setToast(null); setToastAction(null); }, ms);
  };

  const showUndoToast = (msg: string, onUndo: () => void) => {
    setToast(msg);
    setToastAction({ label: "Undo", run: onUndo });
    setTimeout(() => { setToast(null); setToastAction(null); }, 10000);
  };

  const deleteChapter = (id: string) => {
    const idx = chapters.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const removed = chapters[idx];
    setChapters((cs) => cs.filter((c) => c.id !== id));
    showUndoToast(`Deleted "${removed.title || "Section"}"`, () =>
      setChapters((cs) => [...cs.slice(0, idx), removed, ...cs.slice(idx)])
    );
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    const idx = ch ? ch.lessons.findIndex((l) => l.id === lessonId) : -1;
    if (!ch || idx < 0) return;
    const removed = ch.lessons[idx];
    setChapters((cs) =>
      cs.map((c) => (c.id === chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c))
    );
    showUndoToast(`Deleted "${removed.title || "Lesson"}"`, () =>
      setChapters((cs) =>
        cs.map((c) =>
          c.id === chapterId
            ? { ...c, lessons: [...c.lessons.slice(0, idx), removed, ...c.lessons.slice(idx)] }
            : c
        )
      )
    );
  };

  const existingQuery = useQuery({
    queryKey: ["instructor-course", existingId],
    queryFn: () => api<LoadedCourse>(`/courses/${existingId}/`),
    enabled: Boolean(existingId),
  });

  // hydrate form state when the existing course loads (UI state only)
  useEffect(() => {
    const c = existingQuery.data;
    if (!c) return;
    setCourseId(String(c.id));
    setValues({
      title: c.title ?? "",
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      whatYouWillLearn: (c.what_you_will_learn ?? []).join(". "),
      pricingType: c.pricing_type ?? "free",
      price: Number(c.price) > 0 ? String(c.price) : "",
      originalPrice: Number(c.original_price) > 0 ? String(c.original_price) : "",
      pgFeesToLearner: c.pg_fees_to_learner ?? false,
    });
    setCoverImage(c.cover_image ?? "");
    setChapters((c.sections ?? []).map((s) => ({
      id: `s${s.id}`,
      title: s.title,
      lessons: s.lessons.map((l) => ({
        id: `l${l.id}`,
        title: l.title,
        kind: l.kind,
        duration: l.duration ?? "",
        resource_url: l.resource_url ?? "",
        quiz_data: l.quiz_data ?? [],
      })),
    })));
  }, [existingQuery.data]);

  useEffect(() => {
    if (existingQuery.error) showToast("Failed to load course");
  }, [existingQuery.error]);

  const loading = Boolean(existingId) && existingQuery.isLoading;

  const step1Mutation = useMutation({
    mutationFn: async () => {
      const price = values.pricingType === "free" ? 0 : Number(values.price);
      const originalPrice = values.pricingType === "free" ? 0 : Number(values.originalPrice || 0);
      const pricing = { price, pricing_type: values.pricingType, original_price: originalPrice, pg_fees_to_learner: values.pgFeesToLearner };
      const learn = values.whatYouWillLearn.split(".").map((s) => s.trim()).filter(Boolean);
      if (courseId) {
        await api(`/courses/${courseId}/`, {
          method: "PATCH",
          body: JSON.stringify({ title: values.title.trim(), subtitle: values.subtitle.trim(), description: values.description.trim(), what_you_will_learn: learn, ...pricing }),
        });
        return courseId;
      }
      const course = await api<{ id: string }>("/courses/", {
        method: "POST",
        body: JSON.stringify({ title: values.title.trim(), subtitle: values.subtitle.trim(), description: values.description.trim(), what_you_will_learn: learn, category: "Engineering", level: "beginner", ...pricing }),
      });
      return String(course.id);
    },
    onSuccess: (id) => {
      setCourseId(id);
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      setStep(1);
    },
    onError: (e) => showToast(String(e)),
  });

  const onStep1Submit = () => {
    const parsed = step1Schema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof typeof errors;
        if (key === "title" || key === "description" || key === "price") next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    step1Mutation.mutate();
  };

  const creating = step1Mutation.isPending;

  const addChapter = (title = "New section") => {
    const ch: Chapter = { id: `s${Date.now()}`, title, lessons: [] };
    setChapters((cs) => [...cs, ch]);
    return ch;
  };

  const onFirstManual = () => {
    if (chapters.length === 0) {
      const ch = addChapter("Section 1");
      setPickerFor(ch.id);
    }
  };

  const onAddLesson = (chapterId: string) => setPickerFor(chapterId);

  const pickLesson = (kind: LessonKind) => {
    if (!pickerFor) return;
    setChapters((cs) => cs.map((c) =>
      c.id === pickerFor ? { ...c, lessons: [...c.lessons, makeLesson(kind)] } : c
    ));
    setPickerFor(null);
  };

  const updateLesson = (chapterId: string, lessonId: string, patch: Partial<Lesson>) => {
    setChapters((cs) => cs.map((c) =>
      c.id === chapterId
        ? { ...c, lessons: c.lessons.map((l) => l.id === lessonId ? { ...l, ...patch } : l) }
        : c
    ));
  };

  const uploadLessonFile = async (chapterId: string, lessonId: string, file: File) => {
    setUploadingId(lessonId);
    try {
      const { url } = await uploadFile(file);
      updateLesson(chapterId, lessonId, { resource_url: url });
    } catch {
      showToast("Upload failed — try again");
    } finally {
      setUploadingId(null);
    }
  };

  const saveCourse = async (publish: boolean) => {
    if (!courseId) return;
    if (publish) setPublishing(true);
    else setSaving(true);
    try {
      if (coverImage) {
        await api(`/courses/${courseId}/`, {
          method: "PATCH",
          body: JSON.stringify({ cover_image: absoluteMediaUrl(coverImage) }),
        });
      }
      await api(`/courses/${courseId}/curriculum/`, {
        method: "PUT",
        body: JSON.stringify({ sections: chapters.map((c, i) => ({ title: c.title || `Section ${i + 1}`, lessons: c.lessons.map((l, li) => ({ title: l.title, kind: l.kind, duration: l.duration, resource_url: l.resource_url, quiz_data: l.quiz_data ?? [], order: li })) })) }),
      });
      if (publish) {
        await api(`/courses/${courseId}/publish/`, { method: "POST" });
        setPublishOpen(false);
        showToast("Published ✓ — visible to learners");
      } else {
        showToast("Saved ✓");
      }
      setTimeout(() => nav("/courses"), 900);
    } catch (e) {
      const msg = String(e);
      showToast(
        /network|fetch|load/i.test(msg) ? "Couldn't save — check connection, then retry" : msg,
        4000
      );
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const paidInvalid =
    values.pricingType === "one_time" &&
    (Number(values.price) <= 0 ||
      (Number(values.originalPrice) > 0 && Number(values.price) > Number(values.originalPrice)));
  const publishChecks = [
    {
      label: "Course details complete",
      ok: values.title.trim().length >= 4 && values.description.trim().length >= 10,
      hint: "Title needs 4+ characters, description 10+",
    },
    {
      label: "Cover image added",
      ok: coverImage.trim().length > 0,
      hint: "Upload a cover — it's the first thing learners see",
    },
    {
      label: "At least 1 lesson",
      ok: chapters.some((c) => c.lessons.some((l) => l.title.trim().length > 0)),
      hint: "Add a chapter with a titled lesson",
    },
    {
      label: values.pricingType === "free" ? "Free course — price OK" : "Price valid",
      ok: !paidInvalid,
      hint: "Selling price must be above ₹0 and not exceed MRP",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f1]">
        <div className="w-full px-4 py-16 text-center text-sm text-zinc-500 sm:px-4">Loading course…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      {step === 0 ? (
        <div className="w-full px-4 py-3 sm:px-6">
          <CourseBuilderHeader
            title={values.title}
            saving={saving || publishing}
            disabled={!courseId}
            onPreview={() => setPreviewOpen(true)}
            onPublish={() => setPublishOpen(true)}
            onSave={() => saveCourse(false)}
          />
          <div className="mt-4">
            <StepIndicator step={0} canGoBuilder={Boolean(courseId)} onNavigate={setStep} />
          </div>
          <div className="mt-4">
            <CourseCreateStep1
              values={values}
              errors={errors}
              isSubmitting={creating}
              editing={Boolean(courseId)}
              onAiClick={() => showToast("AI generation coming soon ✨")}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
              onSubmit={onStep1Submit}
            />
          </div>
        </div>
      ) : (
        <div className="w-full px-4 py-3 sm:px-6">
          <CourseBuilderHeader title={values.title} saving={saving || publishing} onPreview={() => setPreviewOpen(true)} onPublish={() => setPublishOpen(true)} onSave={() => saveCourse(false)} />
          <div className="mt-4">
            <StepIndicator step={1} canGoBuilder={Boolean(courseId)} onNavigate={setStep} />
          </div>
          <CourseCreateStep2
            coverImage={coverImage}
            chapters={chapters}
            uploadingId={uploadingId}
            onCoverChange={setCoverImage}
            onRenameChapter={(id, t) => setChapters((cs) => cs.map((c) => c.id === id ? { ...c, title: t } : c))}
            onDeleteChapter={deleteChapter}
            onAddChapter={() => addChapter()}
            onFirstManual={onFirstManual}
            onAiGenerate={() => showToast("AI outline generation coming soon ✨")}
            onAddLesson={onAddLesson}
            onUpdateLesson={updateLesson}
            onDeleteLesson={deleteLesson}
            onUploadLesson={uploadLessonFile}
          />
        </div>
      )}

      {pickerFor && (
        <LessonTypePicker
          onSelect={pickLesson}
          onClose={() => setPickerFor(null)}
        />
      )}

      {previewOpen && courseId && (
        <StudentPreviewModal courseId={courseId} onClose={() => setPreviewOpen(false)} />
      )}

      {publishOpen && (
        <PublishChecklistModal
          checks={publishChecks}
          publishing={publishing}
          onConfirm={() => saveCourse(true)}
          onClose={() => setPublishOpen(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">
          <span>{toast}</span>
          {toastAction && (
            <button
              onClick={() => { toastAction.run(); setToast(null); setToastAction(null); }}
              className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-zinc-900"
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}