import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate } from "react-router-dom";
import { z } from "zod";
import { CourseBuilderHeader } from "../components/CourseBuilderHeader";
import { InstructorHeader } from "../components/InstructorHeader";
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
    subtitle: z.string().trim().max(255, "Subtitle can't exceed 255 characters"),
    description: z.string().trim().min(10, "Add a short description"),
    pricingType: z.enum(["free", "one_time"]),
    price: z.string(),
    originalPrice: z.string(),
    discountPercent: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.pricingType !== "one_time") return;
    const price = Number(v.price);
    const original = Number(v.originalPrice || 0);
    if (price <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Enter a price for paid course",
      });
    }
    if (price > 99999.99) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price can't exceed ₹99,999.99",
      });
    }
    if (original > 99999.99) {
      ctx.addIssue({
        code: "custom",
        path: ["originalPrice"],
        message: "MRP can't exceed ₹99,999.99",
      });
    }
    if (original > 0 && price > original) {
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
  discountPercent: "",
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
  if (kind === "quiz")
    base.quiz_data = [{ id: `q${Date.now()}`, type: "text", question: "", options: ["", ""], correct: 0 }];
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
  const [errors, setErrors] = useState<
    Partial<Record<"title" | "subtitle" | "description" | "price" | "originalPrice", string>>
  >({});
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
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [serverDirty, setServerDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const hydratedRef = useRef(false);
  const skipDirtyRef = useRef(false);
  const draftKey = `instructor:course-draft:${existingId || "new"}`;

  const markDirty = () => {
    if (hydratedRef.current) setServerDirty(true);
  };

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
    skipDirtyRef.current = true;
    setCourseId(String(c.id));
    setValues({
      title: c.title ?? "",
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      whatYouWillLearn: (c.what_you_will_learn ?? []).join(". "),
      pricingType: c.pricing_type ?? "free",
      price: Number(c.price) > 0 ? String(c.price) : "",
      originalPrice: Number(c.original_price) > 0 ? String(c.original_price) : "",
      discountPercent:
        Number(c.original_price) > 0 && Number(c.price) > 0
          ? String(Math.max(0, Math.round((1 - Number(c.price) / Number(c.original_price)) * 100)))
          : "",
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
    setServerDirty(false);
  }, [existingQuery.data]);

  useEffect(() => {
    if (existingQuery.error) showToast("Failed to load course");
  }, [existingQuery.error]);

  // restore unsent draft for the new-course flow (refresh-safe step 0)
  useEffect(() => {
    if (existingId) {
      hydratedRef.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as { values?: CourseStep1 };
        if (draft.values) setValues((v) => ({ ...v, ...draft.values }));
      }
    } catch { /* no draft */ }
    hydratedRef.current = true;
  }, [draftKey, existingId]);

  // persist draft locally so refresh never loses work
  useEffect(() => {
    if (!hydratedRef.current || existingId) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ values, updatedAt: Date.now() }));
        setLastSavedAt(new Date().toLocaleTimeString());
      } catch { /* storage unavailable */ }
    }, 800);
    return () => clearTimeout(t);
  }, [values, draftKey, existingId]);

  const blocker = useBlocker(serverDirty && !saving && !publishing);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes. Leave anyway?")) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);

  // any builder edit after hydrate marks the server copy dirty
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, chapters, coverImage]);

  // debounced server autosave once the course exists
  useEffect(() => {
    if (!courseId || !serverDirty || !hydratedRef.current) return;
    if (values.title.trim().length < 4 || values.description.trim().length < 10) return;
    const t = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const price = values.pricingType === "free" ? 0 : Number(values.price);
        const original = values.pricingType === "free" ? 0 : Number(values.originalPrice || 0);
        const learn = values.whatYouWillLearn.split(".").map((s) => s.trim()).filter(Boolean);
        await api(`/courses/${courseId}/`, {
          method: "PATCH",
          body: JSON.stringify({
            title: values.title.trim(),
            subtitle: values.subtitle.trim(),
            description: values.description.trim(),
            what_you_will_learn: learn,
            price,
            pricing_type: values.pricingType,
            original_price: original,
            pg_fees_to_learner: values.pgFeesToLearner,
            ...(coverImage ? { cover_image: absoluteMediaUrl(coverImage) } : {}),
          }),
        });
        await api(`/courses/${courseId}/curriculum/`, {
          method: "PUT",
          body: JSON.stringify({
            sections: chapters.map((c, i) => ({
              title: c.title || `Section ${i + 1}`,
              lessons: c.lessons.map((l, li) => ({
                title: l.title,
                kind: l.kind,
                duration: l.duration,
                resource_url: l.resource_url,
                quiz_data: l.quiz_data ?? [],
                order: li,
              })),
            })),
          }),
        });
        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
        setServerDirty(false);
        setLastSavedAt(new Date().toLocaleTimeString());
      } catch { /* keep dirty — manual Save retries */ }
      finally { setAutoSaving(false); }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverDirty, courseId]);

  const loading = Boolean(existingId) && existingQuery.isLoading;

  const step1Mutation = useMutation({
    mutationFn: async () => {
      if (values.pricingType === "one_time") {
        const price = Number(values.price);
        const original = Number(values.originalPrice || 0);
        if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a price for paid course");
        if (price > 99999.99) throw new Error("Price can't exceed ₹99,999.99");
        if (original > 99999.99) throw new Error("MRP can't exceed ₹99,999.99");
        if (original > 0 && price > original) throw new Error("Selling price can't exceed MRP");
      }
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
      setServerDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      try {
        localStorage.removeItem(draftKey);
      } catch { /* storage unavailable */ }
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
        if (key === "title" || key === "subtitle" || key === "description" || key === "price" || key === "originalPrice")
          next[key] = issue.message;
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

  const uploadQuizMedia = async (file: File): Promise<string> => {
    const { url } = await uploadFile(file);
    return absoluteMediaUrl(url) ?? url;
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
        setServerDirty(false);
        try {
          localStorage.removeItem(draftKey);
        } catch { /* storage unavailable */ }
        showToast("Published ✓ — visible to learners");
        setTimeout(() => nav("/courses"), 900);
      } else {
        setServerDirty(false);
        setLastSavedAt(new Date().toLocaleTimeString());
        showToast("Saved ✓ — stay here, keep building");
      }
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

  const saveStatus = autoSaving || saving || publishing
    ? "Saving…"
    : serverDirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${lastSavedAt}`
        : "";

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      {step === 0 ? (
        <div className="w-full px-4 py-3 sm:px-6">
          <CourseBuilderHeader
            title={values.title}
            saving={saving || publishing || autoSaving}
            saveStatus={saveStatus}
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
          <CourseBuilderHeader title={values.title} saving={saving || publishing || autoSaving} saveStatus={saveStatus} onPreview={() => setPreviewOpen(true)} onPublish={() => setPublishOpen(true)} onSave={() => saveCourse(false)} />
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
            onUploadQuizMedia={uploadQuizMedia}
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