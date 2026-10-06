import { useRef, useState } from "react";
import {
  AlertTriangle,
  Database,
  FileText,
  Plus,
  Sparkles,
  X,
} from "@masterlms/shared";
import type {
  Assignment,
  AssignmentQuestion,
  QuestionDifficulty,
} from "../types/assignment";
import { generateSampleQuestions } from "../utils/questionGenerator";
import {
  assignmentService,
  type ExtractedQuestionRaw,
  type ExtractQuestionsResult,
} from "../services/assignment.service";
import { ApiError } from "../lib/api";
import { cn } from "../lib/utils";
import {
  builderCardClass,
  builderEyebrowClass,
  builderFieldClass,
  builderLabelClass,
} from "../lib/builder";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

type Notice = { kind: "success" | "error" | "info"; text: string; detail?: string };

const inputClass = builderFieldClass;

const topicInput = cn(
  "min-w-0 flex-1 rounded-sm border border-rule bg-slate-panel",
  "px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink",
);

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDifficulty(
  value: unknown,
  fallback: QuestionDifficulty,
): QuestionDifficulty {
  return value === "easy" || value === "medium" || value === "hard"
    ? value
    : fallback;
}

function toPoolQuestion(
  raw: ExtractedQuestionRaw | Record<string, unknown>,
  fallbackMarks: number,
  fallbackDifficulty: QuestionDifficulty,
): AssignmentQuestion {
  const get = (key: string) =>
    (raw as Record<string, unknown>)[key] ??
    (raw as Record<string, unknown>)[camelToSnake(key)];
  const optionsRaw = get("options");
  const options = Array.isArray(optionsRaw) ? [...optionsRaw] : [];
  while (options.length < 2) options.push("");
  return {
    id: makeId("q"),
    question: String(get("question") ?? ""),
    questionImage: String(get("questionImage") ?? "") || "",
    options,
    correctAnswer: Number(get("correctAnswer") ?? 0),
    explanation: String(get("explanation") ?? ""),
    marks: Number(get("marks") ?? fallbackMarks),
    difficulty: normalizeDifficulty(get("difficulty"), fallbackDifficulty),
    topic: String(get("topic") ?? ""),
  };
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function AssignmentGenerateStep({ assignment, onChange }: Props) {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("medium");
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [numberOfOptions, setNumberOfOptions] = useState(4);
  const [generateExplanations, setGenerateExplanations] = useState(true);
  const [topics, setTopics] = useState<[string, number][]>([]);
  const [newTopic, setNewTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [extractNotice, setExtractNotice] = useState<Notice | null>(null);
  const [generateNotice, setGenerateNotice] = useState<Notice | null>(null);
  const [extractProgress, setExtractProgress] = useState<{
    done: number;
    total: number;
    pending: number[];
  } | null>(null);
  const runId = useRef(0);

  const hasSource = Boolean(assignment.sourceDocument);
  const topicDistribution: Record<string, number> = Object.fromEntries(
    topics.filter(([name, n]) => name.trim() && n > 0),
  );

  const appendQuestions = (fresh: AssignmentQuestion[]) => {
    if (fresh.length === 0) return 0;
    onChange({
      questions: [...assignment.questions, ...fresh],
      totalMarks:
        assignment.totalMarks + fresh.reduce((sum, q) => sum + q.marks, 0),
    });
    return fresh.length;
  };

  const summarizeExtract = (list: ExtractedQuestionRaw[]): Notice => {
    const added = appendQuestions(
      list.map((q) => toPoolQuestion(q, marksPerQuestion, difficulty)),
    );
    if (added === 0) {
      return { kind: "error", text: "No questions found in this document." };
    }
    const noAnswer = list.filter(
      (q) => q.needs_review || q.has_answer === false,
    ).length;
    const noFigure = list.filter((q) => q.missing_figure).length;
    const details = [
      noAnswer > 0
        ? `${noAnswer} had no printed answer — set the correct option in Review`
        : null,
      noFigure > 0
        ? `${noFigure} mention a figure that wasn't found — attach it in Review`
        : null,
    ].filter(Boolean);
    return {
      kind: "success",
      text: `${added} question${added === 1 ? "" : "s"} added to your pool.`,
      detail: details.length > 0 ? details.join(". ") + "." : undefined,
    };
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollJob = async (
    jobId: string,
    id: number,
  ): Promise<ExtractQuestionsResult> => {
    for (;;) {
      if (id !== runId.current) throw new Error("cancelled");
      const job = await assignmentService.getExtractJob(jobId);
      if (id !== runId.current) throw new Error("cancelled");
      setExtractProgress({
        done: job.done_pages.length,
        total: job.total_pages,
        pending: job.pending_pages,
      });
      if (job.status === "done" || job.status === "paused") {
        return {
          questions: job.questions,
          done_pages: job.done_pages,
          pending_pages: job.pending_pages,
          skipped_pages: job.skipped_pages,
          total_pages: job.total_pages,
          rate_limited: job.status === "paused",
        };
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Background extract failed");
      }
      await wait(5000);
    }
  };

  const cancelExtract = () => {
    runId.current += 1;
    setExtracting(false);
    setExtractNotice({
      kind: "info",
      text: "Extraction stopped. Questions added so far are kept.",
    });
  };

  const handleExtract = async (resumePending?: number[]) => {
    const id = runId.current + 1;
    runId.current = id;
    setExtracting(true);
    setExtractNotice(null);
    if (!resumePending) setExtractProgress(null);
    let pending = resumePending;
    let attempts = 0;
    try {
      for (;;) {
        if (id !== runId.current) return;
        attempts += 1;
        let result: ExtractQuestionsResult;
        try {
          const started = await assignmentService.extractQuestions({
            source_document: assignment.sourceDocument,
            difficulty,
            marksPerQuestion,
            pending_pages: pending,
            async_mode: true,
          });
          const job = started as ExtractQuestionsResult & { job_id?: string };
          result = job.job_id ? await pollJob(job.job_id, id) : job;
        } catch (e) {
          if (e instanceof ApiError && e.status === 429 && attempts <= 3) {
            const payload = (e.payload ?? {}) as { data?: ExtractQuestionsResult };
            if (payload.data) {
              if (id !== runId.current) return;
              setExtractNotice(summarizeExtract(payload.data.questions));
              setExtractProgress({
                done: payload.data.done_pages.length,
                total: payload.data.total_pages,
                pending: payload.data.pending_pages,
              });
              pending = payload.data.pending_pages;
            }
            setExtractNotice({
              kind: "info",
              text:
                `Rate-limited — resuming automatically (attempt ${attempts}/3). ` +
                "Added questions are kept. You can cancel anytime.",
            });
            await wait(60000);
            continue;
          }
          throw e;
        }
        if (id !== runId.current) return;
        setExtractNotice(summarizeExtract(result.questions));
        setExtractProgress(
          result.total_pages > 0
            ? {
                done: result.done_pages.length,
                total: result.total_pages,
                pending: result.pending_pages,
              }
            : null,
        );
        if (result.rate_limited && result.pending_pages.length > 0 && attempts <= 3) {
          await wait(60000);
          if (id !== runId.current) return;
          pending = result.pending_pages;
          continue;
        }
        break;
      }
    } catch (e) {
      if (id !== runId.current) return;
      if (e instanceof Error && e.message === "cancelled") return;
      setExtractNotice({
        kind: "error",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      if (id === runId.current) setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateNotice(null);
    setAiUnavailable(false);
    try {
      const raw = await assignmentService.generateFromDocument({
        source_document: assignment.sourceDocument,
        numberOfQuestions: count,
        difficulty,
        marksPerQuestion,
        numberOfOptions,
        generateExplanations,
        topicDistribution,
      });
      const added = appendQuestions(
        raw.map((q) => toPoolQuestion(q, marksPerQuestion, difficulty)),
      );
      if (added > 0) {
        setGenerateNotice({
          kind: "success",
          text: `${added} question${added === 1 ? "" : "s"} added to your pool.`,
        });
      } else {
        setGenerateNotice({ kind: "error", text: "Nothing was generated." });
      }
    } catch (e) {
      if (Object.keys(topicDistribution).length === 0 && !hasSource) {
        setGenerateNotice({
          kind: "error",
          text: "Add at least one topic first — the AI needs something to ask about.",
        });
      } else if (e instanceof ApiError) {
        setGenerateNotice({ kind: "error", text: e.message });
      } else {
        setAiUnavailable(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSampleGenerate = () => {
    setGenerating(true);
    try {
      const generated = generateSampleQuestions({
        count,
        difficulty,
        marksPerQuestion,
        numberOfOptions,
        generateExplanations,
        topicDistribution,
      });
      const added = appendQuestions(generated);
      setGenerateNotice(
        added > 0
          ? {
              kind: "success",
              text: `${added} placeholder question${added === 1 ? "" : "s"} added.`,
              detail: "Review and edit every one before publishing.",
            }
          : { kind: "error", text: "Nothing was generated." },
      );
    } finally {
      setGenerating(false);
    }
  };

  const addTopic = () => {
    const name = newTopic.trim();
    if (!name) return;
    setTopics((prev) => [...prev, [name, count]]);
    setNewTopic("");
  };

  const poolCount = assignment.questions.length;

  return (
    <div className="space-y-6">
      <div className={builderCardClass}>
        <p className={builderEyebrowClass}>From a document</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Copy from your PDF</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          Copies the numbered questions and options already printed in the file —
          best when the upload is a question paper.
        </p>
        {!hasSource ? (
          <p className="mt-5 border border-dashed border-rule-strong bg-slate-sunk p-5 text-sm text-ink-muted">
            No document uploaded yet. Go back one step to upload, or generate
            questions below without one.
          </p>
        ) : (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={extracting}
                className={cn(
                  "inline-flex items-center gap-2 rounded-sm border px-5 py-2",
                  "text-sm font-semibold",
                  extracting
                    ? "cursor-wait border-rule bg-slate-sunk text-ink-faint"
                    : "border-live bg-live text-ink-inverse hover:bg-live/88",
                )}
              >
                <FileText size={16} className={extracting ? "animate-pulse" : ""} />
                {extracting ? "Extracting…" : "Use PDF questions"}
              </button>
              {extracting ? (
                <button
                  type="button"
                  onClick={cancelExtract}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-sm border",
                    "border-rule-strong px-4 py-2 text-xs font-semibold hover:bg-slate-sunk",
                  )}
                >
                  <X size={13} /> Cancel
                </button>
              ) : (
                extractProgress &&
                extractProgress.pending.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleExtract(extractProgress.pending)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-sm border tnum",
                      "border-live px-5 py-2 text-sm font-semibold",
                      "text-live hover:bg-live-soft",
                    )}
                  >
                    Resume ({extractProgress.pending.length} pages left)
                  </button>
                )
              )}
            </div>
            {extractProgress && extractProgress.total > 0 && (
              <ProgressBar done={extractProgress.done} total={extractProgress.total} />
            )}
            {extractProgress && extractProgress.pending.length > 0 && !extracting && (
              <p className="mt-1 text-xs text-ink-muted tnum">
                {extractProgress.done} of {extractProgress.total} pages done —{" "}
                {extractProgress.pending.length} pending.
              </p>
            )}
            {extractNotice && <NoticeBox notice={extractNotice} />}
          </div>
        )}
      </div>

      <div className={builderCardClass}>
        <p className={builderEyebrowClass}>New with AI</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Write new questions with AI</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          {hasSource
            ? "Fresh questions about the document content."
            : "Fresh questions about your topics below — no upload needed."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <label className={builderLabelClass}>
            Questions
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Number(e.target.value) || 1))
              }
              className={cn(inputClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
              className={inputClass}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className={builderLabelClass}>
            Marks each
            <input
              type="number"
              min={1}
              max={100}
              value={marksPerQuestion}
              onChange={(e) =>
                setMarksPerQuestion(Math.max(1, Number(e.target.value) || 1))
              }
              className={cn(inputClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Options
            <select
              value={numberOfOptions}
              onChange={(e) => setNumberOfOptions(Number(e.target.value))}
              className={cn(inputClass, "tnum")}
            >
              <option value={3}>3 options</option>
              <option value={4}>4 options</option>
              <option value={5}>5 options</option>
            </select>
          </label>
        </div>

        <div className="mt-6 border border-rule bg-slate-sunk p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">
            Topics{" "}
            <span className="font-normal text-ink-muted">
              —{" "}
              {hasSource
                ? "optional, controls what the questions cover"
                : "required without an upload: what the AI should ask about"}
            </span>
          </p>
          {topics.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {topics.map(([name, n], i) => (
                <div key={`${name}-${i}`} className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setTopics((prev) =>
                        prev.map((row, j) => (j === i ? [e.target.value, row[1]] : row)),
                      )
                    }
                    aria-label="Topic name"
                    className={topicInput}
                  />
                  <input
                    type="number"
                    min={1}
                    value={n}
                    onChange={(e) =>
                      setTopics((prev) =>
                        prev.map((row, j) =>
                          j === i
                            ? [row[0], Math.max(1, Number(e.target.value) || 1)]
                            : row,
                        ),
                      )
                    }
                    title="Questions on this topic"
                    aria-label="Questions on this topic"
                    className={cn(
                      "w-20 rounded-sm border border-rule bg-slate-panel",
                      "px-3 py-2 text-sm tnum focus:border-ink",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setTopics((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded-sm p-3 text-ink-faint hover:bg-halt-soft hover:text-halt"
                    title="Remove topic"
                    aria-label="Remove topic"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="e.g. Percentage"
              aria-label="New topic"
              className={topicInput}
            />
            <button
              type="button"
              onClick={addTopic}
              className={cn(
                "inline-flex h-12 shrink-0 items-center gap-2 rounded-sm border",
                "border-rule-strong px-4 text-sm font-semibold hover:bg-slate-panel",
              )}
            >
              <Plus size={14} /> Add topic
            </button>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={generateExplanations}
              onChange={(e) => setGenerateExplanations(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Write an explanation for each answer
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-sm border px-6",
              "text-[15px] font-semibold",
              generating
                ? "cursor-wait border-rule bg-slate-sunk text-ink-faint"
                : "border-ink bg-ink text-ink-inverse hover:bg-ink/88",
            )}
          >
            <Sparkles size={16} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating…" : "Generate questions"}
          </button>
        </div>
        {generateNotice && <NoticeBox notice={generateNotice} />}

        {aiUnavailable && (
          <div className="mt-4 border border-hold/30 bg-hold-soft p-5">
            <p className="flex items-start gap-2 text-sm text-hold">
              <Database size={15} className="mt-0.5 shrink-0" />
              <span>
                The AI service isn&apos;t reachable, so these would be local
                placeholders. Review and edit every one before publishing.
              </span>
            </p>
            <button
              type="button"
              onClick={handleSampleGenerate}
              disabled={generating}
              className={cn(
                "mt-4 inline-flex h-11 items-center gap-2 rounded-sm border",
                "border-hold/40 bg-slate-panel px-5 text-sm font-semibold text-ink",
                "hover:bg-slate-sunk disabled:opacity-50",
              )}
            >
              <Database size={14} />
              {generating ? "Generating…" : "Generate placeholders instead"}
            </button>
          </div>
        )}
      </div>

      {poolCount > 0 && (
        <p className="border border-live/25 bg-live-soft p-4 text-sm font-semibold text-live tnum">
          {poolCount} question{poolCount === 1 ? "" : "s"} in your pool — continue to
          review them.
        </p>
      )}
    </div>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = Math.round((done / Math.max(1, total)) * 100);
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule">
        <div
          className="h-full rounded-full bg-live transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-muted tnum">
        {done} of {total} pages done.
      </p>
    </div>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 border p-4 text-sm",
        notice.kind === "success" && "border-live/25 bg-live-soft text-live",
        notice.kind === "error" && "border-halt/25 bg-halt-soft text-halt",
        notice.kind === "info" && "border-rule bg-slate-sunk text-ink-muted",
      )}
    >
      {notice.kind === "error" && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
      <span>
        <span className="font-semibold">{notice.text}</span>
        {notice.detail && <span className="mt-0.5 block">{notice.detail}</span>}
      </span>
    </div>
  );
}

