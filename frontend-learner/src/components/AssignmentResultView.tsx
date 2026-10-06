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
import { Badge } from "./Badge";
import { Segmented } from "./Button";
import { Panel } from "./Panel";

type Props = {
  result: AssignmentResultPayload | undefined;
  isLoading: boolean;
  error: Error | null;
};

type ReviewFilter = "all" | "needs-work" | "correct";

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-ink-muted hover:text-ink transition-colors",
);

const resultPill = cn(
  "inline-flex shrink-0 items-center gap-1",
  "px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
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
    <div className="min-h-screen bg-room">
      <TopNav />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {isLoading && (
          <Panel className="p-10 text-sm text-ink-muted">
            Loading result…
          </Panel>
        )}
        {error && (
          <Panel className="p-10 text-sm text-halt">
            {error.message}
          </Panel>
        )}
        {result && (
          <div className="space-y-5">
            <Panel className="p-8 sm:p-10">
              <Link to="/assignments" className={backLink}>
                <ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> All tests
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Badge tone={result.attempt.passed ? "live" : "halt"} showIcon={false} className="px-3 py-1.5 text-sm">
                  {result.attempt.passed ? (
                    <Shield size={16} aria-hidden />
                  ) : (
                    <AlertCircle size={16} aria-hidden />
                  )}
                  {result.attempt.passed ? "Passed" : "Not passed"}
                </Badge>
                <span className="text-sm font-semibold text-ink">
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
                  "tnum mt-3 grid grid-cols-2 gap-3 border border-rule bg-room-sunk p-4",
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

              <div className="tnum mt-3 text-xs text-ink-muted">
                <span>+{result.attempt.positive_marks} correct</span>
                {" · "}
                <span>-{result.attempt.negative_marks} wrong</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to={`/assignments/${result.attempt.assignment}`}
                  className={cn(
                    "inline-flex h-12 items-center justify-center gap-1.5 border border-ink",
                    "bg-ink px-6 text-sm font-semibold text-ink-inverse transition-colors",
                    "hover:bg-ink/88",
                  )}
                >
                  <RefreshCw size={14} aria-hidden /> Retake test
                </Link>
                <Link
                  to="/assignments"
                  className={cn(
                    "inline-flex h-12 items-center justify-center border border-rule-strong",
                    "bg-room-raised px-6 text-sm font-semibold text-ink transition-colors",
                    "hover:bg-room-sunk",
                  )}
                >
                  Back to tests
                </Link>
              </div>
            </Panel>

            {result.transcript.steps.length > 0 && (
              <Panel className="p-8 sm:p-10">
                <h2 className="text-sm font-semibold text-ink">How each section went</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                      <tr
                        className={cn(
                          "border-b border-rule text-[10px] uppercase",
                          "tracking-[0.14em] text-ink-faint",
                        )}
                      >
                        <th className="py-2 pr-4 font-semibold">Section</th>
                        <th className="py-2 pr-4 font-semibold">Attempted</th>
                        <th className="py-2 font-semibold">Correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transcript.steps.map((step) => (
                        <tr key={step.step_id} className="row-hover border-b border-rule">
                          <td className="py-3 pr-4 font-medium text-ink">{step.name}</td>
                          <td className="tnum py-3 pr-4 text-ink-muted">
                            {step.attempted} / {step.questions}
                          </td>
                          <td className="tnum py-3 font-semibold text-live">
                            {step.correct}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {review.length > 0 && (
              <Panel className="p-8 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-ink">Answer review</h2>
                  <Segmented
                    size="sm"
                    value={filter}
                    onChange={setFilter}
                    ariaLabel="Filter answer review"
                    options={[
                      { value: "all" as const, label: `All (${review.length})` },
                      { value: "needs-work" as const, label: `Needs work (${needsWork.length})` },
                      { value: "correct" as const, label: `Correct (${correct.length})` },
                    ]}
                  />
                </div>
                {visible.length === 0 ? (
                  <p
                    className={cn(
                      "mt-4 border border-dashed border-rule-strong p-6",
                      "text-center text-xs text-ink-muted",
                    )}
                  >
                    Nothing in this group — nice work.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {visible.map((item) => (
                      <div
                        key={item.question_id}
                        className="border border-rule p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm leading-relaxed font-medium text-ink">
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
                                  "mt-2 h-32 w-full border",
                                  "border-rule object-contain bg-room-sunk",
                                )}
                              />
                            )}
                          </div>
                          {item.is_correct ? (
                            <span
                              className={cn(
                                resultPill,
                                "bg-live-soft text-live",
                              )}
                            >
                              <CheckCircle2 size={12} aria-hidden /> Correct
                            </span>
                          ) : (
                            <span
                              className={cn(resultPill, "bg-halt-soft text-halt")}
                            >
                              <AlertCircle size={12} aria-hidden />{" "}
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
                                  "border px-3 py-2",
                                  isCorrectChoice
                                    ? "border-live/30 bg-live-soft text-live"
                                    : isSelected
                                      ? "border-halt/30 bg-halt-soft text-halt"
                                      : "border-rule bg-room-sunk text-ink-muted",
                                )}
                              >
                                <span className="mr-2 font-semibold">
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
                                      "mb-1 h-16 w-24 border",
                                      "border-rule bg-room-raised object-contain",
                                    )}
                                  />
                                )}
                                <span>{optionText(option)}</span>
                                {isCorrectChoice && (
                                  <span className="ml-2 text-[10px] font-semibold uppercase">
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
                              "mt-3 border border-rule bg-room-sunk p-3 text-xs leading-relaxed",
                              "text-ink-muted",
                            )}
                          >
                            <span className="font-semibold text-ink">
                              Explanation:{" "}
                            </span>
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </div>
        )}
      </main>
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
    <div className="border border-rule bg-room-sunk p-4">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </p>
      <p
        className={cn(
          "tnum mt-1 text-lg font-semibold",
          accent === "good" && "text-live",
          accent === "bad" && "text-halt",
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
      <p className="font-semibold tracking-[0.14em] text-ink-faint uppercase">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}
