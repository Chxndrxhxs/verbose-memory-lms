import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { EXAM_MODULE_META } from "@masterlms/shared";
import {
  adminCreatePack,
  adminGetPack,
  adminPublishPack,
  adminSetPackQuestions,
  adminUnpublishPack,
  adminUpdatePack,
  getQuestionBank,
  getQuestionBankTopics,
} from "@masterlms/shared";
import { assignmentService } from "../services/assignment.service";
import { PackInfoStep } from "../components/PackInfoStep";
import { PackQuestionsStep } from "../components/PackQuestionsStep";
import { PackModulesStep } from "../components/PackModulesStep";
import { PackPublishStep } from "../components/PackPublishStep";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import {
  bankToDraft,
  createCustomQuestion,
  draftToApi,
  emptyPackInfo,
  packDetailToInfo,
  packDetailToQuestions,
  rawToDraft,
  type PackInfoDraft,
  type PackQuestionDraft,
} from "../types/pack";

const STEPS = ["Details", "Questions", "Formats & price", "Review"] as const;

export function PackBuilderContainer({ existingId }: { existingId?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [packId, setPackId] = useState<string | null>(existingId ?? null);
  const [info, setInfo] = useState<PackInfoDraft>(emptyPackInfo());
  const [questions, setQuestions] = useState<PackQuestionDraft[]>([]);
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bankQuery, setBankQuery] = useState("");
  const [bankTopic, setBankTopic] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [generating, setGenerating] = useState(false);

  // Defer bank search so every keystroke isn't a request.
  const deferredQuery = useDeferredValue(bankQuery.trim());

  const existingQuery = useQuery({
    queryKey: ["pack-admin", existingId],
    queryFn: () => adminGetPack(Number(existingId)),
    enabled: Boolean(existingId),
  });

  useEffect(() => {
    if (existingQuery.data) {
      setInfo(packDetailToInfo(existingQuery.data));
      setQuestions(packDetailToQuestions(existingQuery.data));
      setStatus(existingQuery.data.status);
    }
  }, [existingQuery.data]);

  const bankQueryResult = useQuery({
    queryKey: ["question-bank", deferredQuery, bankTopic, bankDifficulty],
    queryFn: () =>
      getQuestionBank({
        q: deferredQuery || undefined,
        topic: bankTopic || undefined,
        difficulty: bankDifficulty || undefined,
      }),
    enabled: step === 1,
  });

  const bankTopicsResult = useQuery({
    queryKey: ["question-bank-topics"],
    queryFn: () => getQuestionBankTopics(),
    enabled: step === 1,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const addedBankIds = useMemo(() => {
    const ids = new Set<number>();
    for (const q of questions) {
      const source = q.source as { kind?: string; bank_id?: number };
      if (source.kind === "bank" && typeof source.bank_id === "number") {
        ids.add(source.bank_id);
      }
    }
    return [...ids];
  }, [questions]);

  const captions = [
    info.title.trim() || "Missing title",
    `${questions.length} added`,
    info.allowed_modules.map((m) => EXAM_MODULE_META[m].label).join(", ") ||
      "None enabled",
    status === "published" ? "Live" : "Draft",
  ];

  const blockers = [
    info.title.trim() ? null : "Give the pack a title to continue.",
    questions.length > 0 ? null : "Add at least one question to continue.",
    info.allowed_modules.length > 0 ? null : "Enable at least one format to continue.",
    null,
  ];
  const blocker = blockers[step];
  const canNavigate = packId != null;

  /** Create the pack row on first save so later steps have an id. */
  const ensurePack = async (): Promise<string | null> => {
    if (packId) return packId;
    if (!info.title.trim()) {
      showToast("Give the pack a title first.");
      return null;
    }
    setSaving(true);
    try {
      const created = await adminCreatePack({
        title: info.title,
        description: info.description,
        cover: info.cover,
        inter_category: info.inter_category,
        price: info.price,
        original_price: info.original_price,
        allowed_modules: info.allowed_modules,
        max_attempts: info.max_attempts,
      });
      setPackId(String(created.id));
      setStatus(created.status);
      return String(created.id);
    } catch (e) {
      showToast(String(e));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveInfo = async (): Promise<boolean> => {
    const id = await ensurePack();
    if (!id) return false;
    setSaving(true);
    try {
      const updated = await adminUpdatePack(Number(id), {
        title: info.title,
        description: info.description,
        cover: info.cover,
        inter_category: info.inter_category,
        price: info.price,
        original_price: info.original_price,
        allowed_modules: info.allowed_modules,
        max_attempts: info.max_attempts,
        test_size: info.test_size,
        test_duration_seconds: info.test_duration_seconds,
        set_size: info.set_size,
        set_duration_seconds: info.set_duration_seconds,
        execution_mode: info.execution_mode,
        passing_percentage: info.passing_percentage,
        negative_marking: info.negative_marking,
      });
      setStatus(updated.status);
      return true;
    } catch (e) {
      showToast(String(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveQuestions = async (): Promise<boolean> => {
    const id = await ensurePack();
    if (!id) return false;
    setSaving(true);
    try {
      await adminSetPackQuestions(
        Number(id),
        questions.map(draftToApi),
      );
      return true;
    } catch (e) {
      showToast(String(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (blocker) {
      showToast(blocker);
      return;
    }
    if (step === 0 || step === 2) {
      if (!(await saveInfo())) return;
    }
    if (step === 1) {
      if (!(await saveQuestions())) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goTo = (index: number) => {
    if (index === step) return;
    if (!canNavigate && index > 0) {
      showToast("Save the details first — give the pack a title and continue.");
      return;
    }
    setStep(index);
  };

  const addFromBank = (ids: number[]) => {
    const fresh = (bankQueryResult.data ?? []).filter(
      (b) => ids.includes(b.id) && !addedBankIds.includes(b.id),
    );
    if (fresh.length === 0) return;
    setQuestions((prev) => [...prev, ...fresh.map(bankToDraft)]);
    showToast(
      `${fresh.length} question${fresh.length === 1 ? "" : "s"} added — review them above.`,
    );
  };

  const updateQuestion = (id: string, patch: Partial<PackQuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (id: string, dir: "up" | "down") => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const nextList = [...prev];
      [nextList[idx], nextList[target]] = [nextList[target], nextList[idx]];
      return nextList;
    });
  };

  const handleGenerate = async (count: number, difficulty: string, topic: string) => {
    if (!topic.trim()) {
      showToast("Give a category first — the AI needs something to ask about.");
      return;
    }
    setGenerating(true);
    try {
      const res = await assignmentService.generateQuestions("pack", {
        numberOfQuestions: count,
        difficulty,
        marksPerQuestion: 1,
        numberOfOptions: 4,
        generateExplanations: true,
        distributeEvenly: true,
        ...(topic ? { topicDistribution: { [topic]: count } } : {}),
      });
      const list: unknown[] = Array.isArray(res)
        ? res
        : Array.isArray((res as { questions?: unknown }).questions)
          ? (res as { questions: unknown[] }).questions
          : [];
      setQuestions((prev) => [...prev, ...list.map(rawToDraft)]);
      showToast(
        list.length > 0
          ? `${list.length} questions generated — review them above.`
          : "Nothing was generated.",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!packId) return;
    setSaving(true);
    try {
      await adminPublishPack(Number(packId));
      setStatus("published");
      showToast("Pack published. Learners can buy it now.");
    } catch (e) {
      showToast(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!packId) return;
    setSaving(true);
    try {
      await adminUnpublishPack(Number(packId));
      setStatus("draft");
      showToast("Pack unpublished.");
    } catch (e) {
      showToast(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (existingId && existingQuery.isLoading) {
    return <p className="py-20 text-center text-sm text-zinc-500">Loading pack…</p>;
  }

  return (
    <div className="space-y-6">
      <div className={builderCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
              {existingId ? "Edit pack" : "New pack"} · Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              {info.title.trim() || "Untitled pack"}
            </h1>
            <p className="mt-1.5 text-[15px] text-zinc-500">{STEPS[step]}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              status === "published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-500",
            )}
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        <ol className="mb-0 mt-6 flex flex-wrap items-center gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            const locked = !canNavigate && i > 0;
            return (
              <li key={label} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-4 bg-zinc-300" aria-hidden />}
                <button
                  onClick={() => goTo(i)}
                  disabled={locked}
                  title={locked ? "Save the details first" : captions[i]}
                  className={cn(
                    "rounded-2xl border px-4 py-2 text-left transition-all",
                    current
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : done
                        ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                        : "border-zinc-200 bg-white hover:border-zinc-400",
                    locked && "cursor-not-allowed opacity-50 hover:border-zinc-200",
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-bold",
                      current ? "text-white" : done ? "text-emerald-800" : "text-zinc-900",
                    )}
                  >
                    {i + 1}. {label}
                  </span>
                  <span
                    className={cn(
                      "block max-w-40 truncate text-[11px]",
                      current ? "text-white/70" : "text-zinc-500",
                    )}
                  >
                    {captions[i]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 0 && <PackInfoStep info={info} onChange={setInfo} />}
      {step === 1 && (
        <PackQuestionsStep
          questions={questions}
          addedBankIds={addedBankIds}
          onUpdateQuestion={updateQuestion}
          onRemove={(id) => setQuestions((prev) => prev.filter((q) => q.id !== id))}
          onMove={moveQuestion}
          onAddCustom={() =>
            setQuestions((prev) => [...prev, createCustomQuestion(bankTopic)])
          }
          bankQuery={bankQuery}
          onBankQuery={setBankQuery}
          bankTopic={bankTopic}
          onBankTopic={setBankTopic}
          bankDifficulty={bankDifficulty}
          onBankDifficulty={setBankDifficulty}
          bankTopics={bankTopicsResult.data ?? []}
          bankResults={bankQueryResult.data ?? []}
          bankLoading={bankQueryResult.isLoading}
          onAddFromBank={addFromBank}
          onGenerate={handleGenerate}
          generating={generating}
          locked={status === "published"}
        />
      )}
      {step === 2 && (
        <PackModulesStep info={info} onChange={setInfo} questionCount={questions.length} />
      )}
      {step === 3 && (
        <PackPublishStep
          info={info}
          questions={questions}
          status={status}
          saving={saving}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      )}

      <div className={cn(builderCardClass, "flex items-center justify-between gap-3 !p-4 sm:!p-5")}>
        <button
          onClick={() => (step === 0 ? navigate("/packs") : setStep((s) => s - 1))}
          className={cn(
            "inline-flex h-12 items-center rounded-full border border-zinc-200 px-6 text-sm font-semibold",
            "text-zinc-600 hover:bg-zinc-50",
          )}
        >
          {step === 0 ? "Back to packs" : "Back"}
        </button>
        <div className="flex items-center gap-3">
          {blocker && step < STEPS.length - 1 && (
            <span className="hidden text-sm text-zinc-400 sm:block">{blocker}</span>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={saving || Boolean(blocker)}
              title={blocker ?? "Save and continue"}
              className={cn(
                "inline-flex h-12 items-center rounded-full bg-[#0f172a] px-6 text-sm font-semibold",
                "text-white hover:bg-black disabled:opacity-40",
              )}
            >
              {saving ? "Saving…" : "Save & continue"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/packs")}
              className={cn(
                "inline-flex h-12 items-center rounded-full bg-[#0f172a] px-6 text-sm font-semibold",
                "text-white hover:bg-black",
              )}
            >
              Done
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full",
            "bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl",
          )}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
