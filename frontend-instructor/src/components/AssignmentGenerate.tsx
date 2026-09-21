import { useState } from "react";
import { Sparkles, Settings2, Database, AlertTriangle, FileText } from "@masterlms/shared";
import type { Assignment, QuestionGenerationConfig, QuestionDifficulty } from "../types/assignment";
import { generateSampleQuestions } from "../utils/questionGenerator";
import {
  assignmentService,
  type ExtractedQuestionRaw,
  type ExtractQuestionsResult,
} from "../services/assignment.service";
import { ApiError } from "../lib/api";
import { cn } from "../lib/utils";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

const DEFAULT_CONFIG: QuestionGenerationConfig = {
  numberOfQuestions: 10,
  questionType: "mcq",
  difficulty: "medium",
  marksPerQuestion: 1,
  numberOfOptions: 4,
  generateExplanations: true,
  distributeEvenly: true,
  topicDistribution: {},
};

export function AssignmentGenerateStep({ assignment, onChange }: Props) {
  const [config, setConfig] = useState<QuestionGenerationConfig>(DEFAULT_CONFIG);
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [apiOutput, setApiOutput] = useState<
    "success" | "unavailable" | "extracted" | "extract-error" | ""
  >("");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [extractProgress, setExtractProgress] = useState<{
    done: number;
    total: number;
    pending: number[];
  } | null>(null);

  const applyExtractResult = (result: ExtractQuestionsResult) => {
    const list: ExtractedQuestionRaw[] = Array.isArray(result.questions)
      ? result.questions
      : [];
    const questions = list.map((q) => ({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      question: String(q.question ?? ""),
      questionImage: String(q.questionImage ?? q.question_image ?? "") || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: Number(q.correctAnswer ?? q.correct_answer ?? 0),
      explanation: String(q.explanation ?? ""),
      marks: Number(q.marks ?? config.marksPerQuestion),
      difficulty: (q.difficulty as QuestionDifficulty) ?? config.difficulty,
      topic: String(q.topic ?? ""),
    }));
    if (questions.length > 0) {
      onChange({
        questions: [...assignment.questions, ...questions],
        totalMarks:
          assignment.totalMarks +
          questions.reduce(
            (sum: number, question: { marks: number }) => sum + question.marks,
            0
          ),
      });
      setNeedsReviewCount((prev) =>
        prev + list.filter((q) => q.needs_review || q.has_answer === false).length
      );
    }
    return list.length;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setApiOutput("");
    try {
      const response = await fetch(
        `${
          (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "")
        }/admin/assignments/generate-questions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_document: assignment.sourceDocument,
            numberOfQuestions: config.numberOfQuestions,
            difficulty: config.difficulty,
            marksPerQuestion: config.marksPerQuestion,
            numberOfOptions: config.numberOfOptions,
            generateExplanations: config.generateExplanations,
            distributeEvenly: config.distributeEvenly,
          }),
        }
      );

      if (!response.ok) {
        setApiOutput("unavailable");
        return;
      }

      const json = await response.json();
      const raw = Array.isArray(json.data)
        ? json.data
        : json.data?.questions ?? json.questions ?? [];
      const questions = raw.map((q: Record<string, unknown>) => ({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        question: String(q.question ?? ""),
        questionImage:
          String(q.questionImage ?? q.question_image ?? "") || "",
        options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
        correctAnswer: Number(q.correctAnswer ?? q.correct_answer ?? 0),
        explanation: String(q.explanation ?? ""),
        marks: Number(q.marks ?? config.marksPerQuestion),
        difficulty: (q.difficulty as QuestionDifficulty) ?? config.difficulty,
        topic: String(q.topic ?? ""),
      }));
      if (questions.length > 0) {
        onChange({
          questions: [...assignment.questions, ...questions],
          totalMarks:
            assignment.totalMarks +
            questions.reduce(
              (sum: number, question: { marks: number }) => sum + question.marks,
              0
            ),
        });
        setApiOutput("success");
      } else {
        setApiOutput("unavailable");
      }
    } catch {
      setApiOutput("unavailable");
    } finally {
      setGenerating(false);
    }
  };

  const handleExtract = async (resumePending?: number[]) => {
    setExtracting(true);
    setApiOutput("");
    setExtractError(null);
    if (!resumePending) {
      setNeedsReviewCount(0);
      setExtractProgress(null);
    }
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const pollJob = async (jobId: string): Promise<ExtractQuestionsResult> => {
      for (;;) {
        const job = await assignmentService.getExtractJob(jobId);
        setExtractProgress({
          done: job.done_pages.length,
          total: job.total_pages,
          pending: job.pending_pages,
        });
        if (job.status === "done" || job.status === "paused") return job;
        if (job.status === "failed") throw new Error(job.error || "Background extract failed");
        await wait(5000);
      }
    };
    let pending = resumePending;
    let attempts = 0;
    try {
      for (;;) {
        attempts += 1;
        let result: ExtractQuestionsResult;
        try {
          const started = await assignmentService.extractQuestions({
            source_document: assignment.sourceDocument,
            difficulty: config.difficulty,
            marksPerQuestion: config.marksPerQuestion,
            pending_pages: pending,
            async_mode: true,
          });
          const jobResult = started as ExtractQuestionsResult & { job_id?: string };
          result = jobResult.job_id ? await pollJob(jobResult.job_id) : jobResult;
        } catch (e) {
          if (e instanceof ApiError && e.status === 429 && attempts <= 3) {
            const payload = (e.payload ?? {}) as { data?: ExtractQuestionsResult };
            const data = payload.data;
            if (data) {
              applyExtractResult(data);
              setExtractProgress({
                done: data.done_pages.length,
                total: data.total_pages,
                pending: data.pending_pages,
              });
              pending = data.pending_pages;
            }
            setApiOutput("extract-error");
            setExtractError(
              `Gemini is rate-limited — retrying in 60s (attempt ${attempts}/3). ` +
                "Already extracted questions are kept."
            );
            await wait(60000);
            continue;
          }
          throw e;
        }
        applyExtractResult(result);
        if (result.rate_limited && result.pending_pages.length > 0 && attempts <= 3) {
          setExtractProgress({
            done: result.done_pages.length,
            total: result.total_pages,
            pending: result.pending_pages,
          });
          setApiOutput("extract-error");
          setExtractError(
            `Gemini is rate-limited — resuming ${result.pending_pages.length} ` +
              `page(s) in 60s (attempt ${attempts}/3). Already extracted questions are kept.`
          );
          await wait(60000);
          pending = result.pending_pages;
          continue;
        }
        if (result.questions.length > 0 || assignment.questions.length > 0) {
          setApiOutput("extracted");
          setExtractProgress(
            result.total_pages > 0
              ? {
                  done: result.done_pages.length,
                  total: result.total_pages,
                  pending: result.pending_pages,
                }
              : null
          );
          if (result.rate_limited) {
            setExtractError(
              `Stopped early — ${result.pending_pages.length} page(s) still pending. ` +
                "Click Resume to continue."
            );
          }
        } else {
          setApiOutput("extract-error");
          setExtractError("No questions found in this PDF.");
        }
        pending = result.pending_pages.length > 0 ? result.pending_pages : undefined;
        break;
      }
    } catch (e) {
      setApiOutput("extract-error");
      setExtractError(e instanceof Error ? e.message : String(e));
    } finally {
      setExtracting(false);
    }
  };

  const handleLocalGenerate = () => {
    if (!useLocalFallback) {
      setUseLocalFallback(true);
      return;
    }
    setGenerating(true);
    try {
      const generated = generateSampleQuestions({
        count: config.numberOfQuestions,
        difficulty: config.difficulty,
        marksPerQuestion: config.marksPerQuestion,
        numberOfOptions: config.numberOfOptions,
        generateExplanations: config.generateExplanations,
        topicDistribution: config.topicDistribution,
      });
      onChange({
        questions: [...assignment.questions, ...generated],
        totalMarks:
          assignment.totalMarks +
          generated.reduce((sum, q) => sum + q.marks, 0),
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Questions from your PDF</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Use the questions already printed in the uploaded file, or generate new
        ones about its content.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExtract()}
            disabled={extracting || !assignment.sourceDocument}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all",
              extracting ? "bg-zinc-400 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            <FileText size={16} className={extracting ? "animate-pulse" : ""} />
            {extracting ? "Extracting…" : "Use PDF questions"}
          </button>
          {extractProgress && extractProgress.pending.length > 0 && !extracting && (
            <button
              onClick={() => handleExtract(extractProgress.pending)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Resume ({extractProgress.pending.length} pages left)
            </button>
          )}
          <p className="text-xs text-zinc-500">
            Copies numbered questions + options verbatim, including figures.
            Best when the PDF is a question paper.
          </p>
        </div>
        {extractProgress && extractProgress.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (extractProgress.done / Math.max(1, extractProgress.total)) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {extractProgress.done} of {extractProgress.total} pages done
              {extractProgress.pending.length > 0
                ? ` — ${extractProgress.pending.length} pending`
                : ""}
              .
            </p>
          </div>
        )}
        {!assignment.sourceDocument && (
          <p className="mt-2 text-xs text-amber-600">
            Upload a PDF first to enable extraction.
          </p>
        )}
        {apiOutput === "extracted" && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">
              {assignment.questions.length} question(s) ready from your PDF
            </p>
            <p className="mt-0.5 text-xs text-emerald-600">
              {needsReviewCount > 0
                ? `${needsReviewCount} question(s) had no printed answer — review the correct option before publishing.`
                : "Proceed to the next step to review and edit them."}
            </p>
          </div>
        )}
        {apiOutput === "extract-error" && extractError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      <h3 className="mt-6 text-sm font-bold text-zinc-900">Or generate new questions</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Write fresh questions about the document content with AI.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Questions
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={config.numberOfQuestions}
            onChange={(e) =>
              setConfig({
                ...config,
                numberOfQuestions: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Difficulty
          </label>
          <select
            value={config.difficulty}
            onChange={(e) =>
              setConfig({
                ...config,
                difficulty: e.target.value as QuestionDifficulty,
              })
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Marks / Question
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={config.marksPerQuestion}
            onChange={(e) =>
              setConfig({
                ...config,
                marksPerQuestion: Math.max(1, Number(e.target.value) || 1),
              })
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Options
          </label>
          <select
            value={config.numberOfOptions}
            onChange={(e) =>
              setConfig({
                ...config,
                numberOfOptions: Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          >
            <option value={3}>3 options</option>
            <option value={4}>4 options</option>
            <option value={5}>5 options</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
        >
          <Settings2 size={13} />
          {showConfig ? "Hide options" : "More options"}
        </button>
      </div>

      {showConfig && (
        <div className="mt-3 rounded-xl bg-zinc-50 p-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={config.generateExplanations}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    generateExplanations: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded accent-zinc-900"
              />
              Generate explanations
            </label>
            <label className="flex items-center gap-2.5 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={config.distributeEvenly}
                onChange={(e) => {
                  const distributeEvenly = e.target.checked;
                  if (distributeEvenly && Object.keys(config.topicDistribution).length === 0) {
                    const topics: Record<string, number> = {};
                    for (const t of [
                      "Overview & Introduction",
                      "Core Concepts",
                      "Methodology",
                      "Applications",
                    ]) {
                      const share = Math.round(
                        config.numberOfQuestions / 4
                      );
                      if (share > 0) topics[t] = share;
                    }
                    setConfig({ ...config, distributeEvenly, topicDistribution: topics });
                  } else {
                    setConfig({ ...config, distributeEvenly });
                  }
                }}
                className="h-4 w-4 rounded accent-zinc-900"
              />
              Distribute evenly across document topics
            </label>
          </div>

          {config.distributeEvenly &&
            Object.keys(config.topicDistribution).length > 0 && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold text-zinc-600">
                  Topic distribution
                </p>
                <div className="mt-2 space-y-2">
                  {Object.entries(config.topicDistribution).map(
                    ([topic, count]) => (
                      <div
                        key={topic}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => {
                            const next = {
                              ...config.topicDistribution,
                              [e.target.value]:
                                config.topicDistribution[topic],
                            };
                            delete next[topic];
                            setConfig({
                              ...config,
                              topicDistribution: next,
                            });
                          }}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs outline-none focus:border-zinc-900"
                        />
                        <input
                          type="number"
                          min={0}
                          value={count}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              topicDistribution: {
                                ...config.topicDistribution,
                                [topic]:
                                  Math.max(0, Number(e.target.value) || 0),
                              },
                            })
                          }
                          className="w-16 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:border-zinc-900"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !assignment.sourceDocument}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all",
              generating
                ? "bg-zinc-400 cursor-wait"
                : "bg-[#3478ff] hover:bg-[#2a60cc]"
            )}
          >
            <Sparkles size={16} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating…" : "Generate Questions"}
          </button>
          {!assignment.sourceDocument && (
            <p className="text-xs text-amber-600">
              Upload a PDF first to enable generation.
            </p>
          )}
        </div>

        {apiOutput === "unavailable" && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            <AlertTriangle size={14} />
            <span>
              AI generation service isn&apos;t reachable on this server. You can
              continue in
            </span>
            <button
              onClick={() => {
                setUseLocalFallback(true);
                setApiOutput("");
              }}
              className="font-semibold underline"
            >
              sample mode
            </button>
          </div>
        )}

        {useLocalFallback && (
          <>
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
              <Database size={14} className="mt-0.5" />
              <span>
                Sample mode is active: questions are generated locally as
                placeholders for demonstration. Review and edit every question
                before publishing.
              </span>
            </div>
            <button
              onClick={handleLocalGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              <Database size={15} />
              {generating ? "Generating…" : "Generate sample questions"}
            </button>
          </>
        )}
      </div>

      {assignment.questions.length > 0 && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-800">
            {assignment.questions.length} question(s) ready
          </p>
          <p className="mt-0.5 text-xs text-emerald-600">
            Proceed to the next step to review and edit them.
          </p>
        </div>
      )}
    </div>
  );
}
