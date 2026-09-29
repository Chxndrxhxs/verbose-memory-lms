import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Shield,
  absoluteMediaUrl,
  formatAssignmentDuration,
  optionImage,
  optionText,
  type AssignmentResultPayload,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { TopNav } from "./TopNav";

type Props = {
  result: AssignmentResultPayload | undefined;
  isLoading: boolean;
  error: Error | null;
};

type ReviewFilter = "all" | "needs-work" | "correct";

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-zinc-500 hover:text-zinc-900",
);

const resultPill = cn(
  "inline-flex shrink-0 items-center gap-1 rounded-full",
  "px-2.5 py-0.5 text-[11px] font-bold",
);

function fmtScore(value: string | number): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return String(Math.round(num * 100) / 100);
}

export function AssignmentResultView({ result, isLoading, error }: Props) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const review = result?.review ?? [];
  const needsWork = review.filter((item) => !item.is_correct);
  const correct = review.filter((item) => item.is_correct);
  const visible = filter === "all" ? review : filter === "needs-work" ? needsWork : correct;
  const scoreLabel = result
    ? `${fmtScore(result.attempt.final_score)} / ${fmtScore(result.attempt.max_score)}`
    : "";

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        {isLoading && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-zinc-500">
            Loading result…
          </div>
        )}
        {error && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-red-600">
            {error.message}
          </div>
        )}
        {result && (
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
              <Link to="/assignments" className={backLink}>
                <ArrowLeft size={14} strokeWidth={2.5} /> All tests
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold",
                    result.attempt.passed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {result.attempt.passed ? (
                    <Shield size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {result.attempt.passed ? "Passed" : "Not passed"}
                </span>
                <span className="text-sm font-semibold text-zinc-500">
                  {result.transcript.assignment}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Score" value={scoreLabel} />
                <Stat label="Percentage" value={`${result.attempt.percentage}%`} />
                <Stat
                  label="Correct"
                  value={String(result.attempt.correct)}
                  accent="good"
                />
                <Stat
                  label="Wrong"
                  value={String(result.attempt.wrong)}
                  accent="bad"
                />
              </div>

              <div
                className={cn(
                  "mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4",
                  "text-xs sm:grid-cols-4",
                )}
              >
                <Meta label="Test" value={result.transcript.model} />
                <Meta
                  label="Time taken"
                  value={
                    result.transcript.time_taken_seconds != null
                      ? formatAssignmentDuration(result.transcript.time_taken_seconds)
                      : "—"
                  }
                />
                <Meta
                  label="Answered"
                  value={`${result.attempt.answered} / ${result.attempt.total_questions}`}
                />
                <Meta label="Skipped" value={String(result.attempt.unanswered)} />
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                <span>+{result.attempt.positive_marks} correct</span>
                {" · "}
                <span>-{result.attempt.negative_marks} wrong</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to={`/assignments/${result.attempt.assignment}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-zinc-900",
                    "px-5 py-2.5 text-sm font-semibold text-white transition",
                    "hover:bg-zinc-800",
                  )}
                >
                  <RefreshCw size={14} /> Retake test
                </Link>
                <Link
                  to="/assignments"
                  className={cn(
                    "rounded-full border border-zinc-200 px-5 py-2.5 text-sm",
                    "font-semibold text-zinc-600 transition hover:bg-zinc-50",
                  )}
                >
                  Back to tests
                </Link>
              </div>
            </div>

            {result.transcript.steps.length > 0 && (
              <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
                <h2 className="text-sm font-bold">How each section went</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                      <tr
                        className={cn(
                          "border-b border-zinc-100 text-[11px] uppercase",
                          "tracking-wide text-zinc-400",
                        )}
                      >
                        <th className="py-2 pr-4 font-semibold">Section</th>
                        <th className="py-2 pr-4 font-semibold">Attempted</th>
                        <th className="py-2 font-semibold">Correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transcript.steps.map((step) => (
                        <tr key={step.step_id} className="border-b border-zinc-50">
                          <td className="py-3 pr-4 font-medium">{step.name}</td>
                          <td className="py-3 pr-4 text-zinc-500 tabular-nums">
                            {step.attempted} / {step.questions}
                          </td>
                          <td className="py-3 font-semibold text-emerald-600 tabular-nums">
                            {step.correct}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {review.length > 0 && (
              <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-bold">Answer review</h2>
                  <div className="flex gap-1 rounded-full bg-zinc-100 p-1 text-xs font-semibold">
                    {(
                      [
                        ["all", `All (${review.length})`],
                        ["needs-work", `Needs work (${needsWork.length})`],
                        ["correct", `Correct (${correct.length})`],
                      ] as [ReviewFilter, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cn(
                          "rounded-full px-3 py-1.5",
                          filter === key
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {visible.length === 0 ? (
                  <p
                    className={cn(
                      "mt-4 rounded-2xl border border-dashed border-zinc-300 p-6",
                      "text-center text-xs text-zinc-500",
                    )}
                  >
                    Nothing in this group — nice work.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {visible.map((item) => (
                      <div
                        key={item.question_id}
                        className="rounded-2xl border border-zinc-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm leading-relaxed font-medium">
                              {item.question}
                            </p>
                            {item.question_image && (
                              <img
                                src={
                                  absoluteMediaUrl(item.question_image) ??
                                  item.question_image
                                }
                                alt="Question figure"
                                className={cn(
                                  "mt-2 h-32 w-full rounded-xl border",
                                  "border-zinc-200 object-contain",
                                )}
                              />
                            )}
                          </div>
                          {item.is_correct ? (
                            <span
                              className={cn(
                                resultPill,
                                "bg-emerald-100 text-emerald-700",
                              )}
                            >
                              <CheckCircle2 size={12} /> Correct
                            </span>
                          ) : (
                            <span
                              className={cn(resultPill, "bg-red-100 text-red-600")}
                            >
                              <AlertCircle size={12} />{" "}
                              {item.selected === null ? "Skipped" : "Wrong"}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs">
                          {item.options.map((option, oi) => {
                            const isCorrectChoice = oi === item.correct_answer;
                            const isSelected = oi === item.selected;
                            return (
                              <div
                                key={oi}
                                className={cn(
                                  "rounded-lg border px-3 py-2",
                                  isCorrectChoice
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                    : isSelected
                                      ? "border-red-300 bg-red-50 text-red-700"
                                      : "border-zinc-100 bg-zinc-50 text-zinc-500",
                                )}
                              >
                                <span className="mr-2 font-bold">
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                {optionImage(option) && (
                                  <img
                                    src={
                                      absoluteMediaUrl(optionImage(option)) ??
                                      optionImage(option)
                                    }
                                    alt={optionText(option)}
                                    className={cn(
                                      "mb-1 h-16 w-24 rounded-md border",
                                      "border-zinc-200 bg-white object-contain",
                                    )}
                                  />
                                )}
                                <span>{optionText(option)}</span>
                                {isCorrectChoice && (
                                  <span className="ml-2 text-[10px] font-bold uppercase">
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {item.explanation && (
                          <p
                            className={cn(
                              "mt-3 rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed",
                              "text-zinc-600",
                            )}
                          >
                            <span className="font-bold text-zinc-800">
                              Explanation:{" "}
                            </span>
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          accent === "good" && "text-emerald-600",
          accent === "bad" && "text-red-500",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold tracking-wide text-zinc-400 uppercase">{label}</p>
      <p className="mt-0.5 font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
