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
import type { Chapter, CourseStep1, Lesson, LessonKind } from "../types/courseCreate";

const step1Schema = z
  .object({
    title: z.string().trim().min(4, "At least 4 characters"),
    description: z.string().trim().min(10, "Add a short description"),
    pricingType: z.enum(["free", "one_time"]),
    price: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.pricingType === "one_time" && Number(v.price) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Enter a price for paid course",
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
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <button
            onClick={() => { if (i === 0 || canGoBuilder) onNavigate(i); }}
            disabled={i === 1 && !canGoBuilder}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i <= step ? "bg-[#0f172a] text-white" : "bg-zinc-200 text-zinc-500"} disabled:cursor-not-allowed`}
          >
            {i + 1}
          </button>
          <span className={`text-xs font-semibold ${i <= step ? "text-zinc-900" : "text-zinc-400"}`}>{label}</span>
          {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-zinc-300" />}
        </div>
      ))}
    </div>
  );
}

export function CourseCreateContainer({ existingId = "" }: { existingId?: string }) {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(existingId || null);
  const [values, setValues] = useState<CourseStep1>(initialState);
  const [errors, setErrors] = useState<Partial<Record<"title" | "description" | "price", string>>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
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
    setStep(0);
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
    setSaving(true);
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
        showToast("Published ✓ — visible to learners");
      } else {
        showToast("Saved ✓");
      }
      setTimeout(() => nav("/courses"), 900);
    } catch (e) {
      showToast(String(e));
    } finally {
      setSaving(false);
    }
  };

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
        <div className="w-full px-4 py-6 sm:px-6">
          <StepIndicator step={0} canGoBuilder={Boolean(courseId)} onNavigate={setStep} />
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
          <CourseBuilderHeader title={values.title} saving={saving} onPreview={() => setPreviewOpen(true)} onPublish={() => saveCourse(true)} onSave={() => saveCourse(false)} />
          <div className="mt-4">
            <StepIndicator step={1} canGoBuilder={Boolean(courseId)} onNavigate={setStep} />
          </div>
          <CourseCreateStep2
            coverImage={coverImage}
            chapters={chapters}
            uploadingId={uploadingId}
            onCoverChange={setCoverImage}
            onRenameChapter={(id, t) => setChapters((cs) => cs.map((c) => c.id === id ? { ...c, title: t } : c))}
            onDeleteChapter={(id) => setChapters((cs) => cs.filter((c) => c.id !== id))}
            onAddChapter={() => addChapter()}
            onFirstManual={onFirstManual}
            onAiGenerate={() => showToast("AI outline generation coming soon ✨")}
            onAddLesson={onAddLesson}
            onUpdateLesson={updateLesson}
            onDeleteLesson={(chapterId, lessonId) => setChapters((cs) => cs.map((c) => c.id === chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } : c))}
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}