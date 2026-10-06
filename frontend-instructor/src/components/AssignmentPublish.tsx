import { CheckCircle, AlertCircle, isValidTotalMarks, Save } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import type {
  Assignment,
  AssignmentValidationError,
} from "../types/assignment";
import {
  MODEL_LABELS,
  formatMinutes,
  getTotalQuestions,
  getTotalMarks,
  topicBreakdown,
  totalConfiguredMinutes,
} from "../types/assignment";

type Props = {
  assignment: Assignment;
  errors: AssignmentValidationError[];
};

export function AssignmentPublishStep({ assignment, errors }: Props) {
  const totalQuestions = getTotalQuestions(assignment);
  const untagged = topicBreakdown(assignment.questions).find(
    ([topic]) => topic === "Untagged",
  )?.[1] ?? 0;
  const hasSource = Boolean(
    assignment.sourceDocument || assignment.sourceDocumentName,
  );

  const checks = [
    {
      label: "Title provided",
      ok: Boolean(assignment.title.trim()),
    },
    {
      label: "Exam board selected",
      ok: assignment.board != null,
    },
    {
      label: "Total marks is realistic",
      ok: isValidTotalMarks(assignment.totalMarks),
    },
    {
      label: "At least one question",
      ok: totalQuestions > 0,
    },
    {
      label: "All questions have valid options",
      ok: errors.filter((e) => e.field.startsWith("options_")).length === 0,
    },
    {
      label: "All questions have a correct answer",
      ok: errors.filter((e) => e.field.startsWith("correct_")).length === 0,
    },
    ...(assignment.modelType === "mock"
      ? [
          {
            label: "At least one section",
            ok: assignment.tests.length > 0,
          },
          {
            label: "Every section has questions",
            ok: assignment.tests.every((t) => t.questionIds.length > 0),
          },
          {
            label: "20 Quant + 20 English style coverage",
            ok:
              topicBreakdown(assignment.questions).filter(
                ([topic]) => topic !== "Untagged",
              ).length >= 2,
          },
        ]
      : []),
  ];

  const warnings = [
    !hasSource &&
      "No source document — fine for hand-written sets.",
    untagged > 0 &&
      `${untagged} question${untagged === 1 ? " is" : "s are"} untagged.`,
  ].filter(Boolean) as string[];

  const allValid = checks.every((c) => c.ok);
  const summary: [string, string][] = [
    ["Format", MODEL_LABELS[assignment.modelType]],
    ["Questions", String(totalQuestions)],
    ["Total marks", String(getTotalMarks(assignment) || assignment.totalMarks)],
    ["Duration", formatMinutes(totalConfiguredMinutes(assignment))],
    ["Passing", `${assignment.passingPercentage}%`],
    [
      "Negative marking",
      assignment.negativeMarking ? `Yes (−${assignment.negativeMarks})` : "No",
    ],
  ];

  return (
    <div className={builderCardClass}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Final step
      </p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Review & publish</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        Final check before students can see this assignment.
      </p>

      <div className="mt-6 rounded-sm border border-rule bg-slate-sunk p-4">
        <h3 className="text-sm font-semibold text-ink">
          {assignment.title || "Untitled Assignment"}
        </h3>
        {assignment.description && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
            {assignment.description}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-ink-muted sm:grid-cols-3">
          {summary.map(([label, value]) => (
            <div key={label}>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {label}
              </span>
              <span className="font-semibold text-ink tnum">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Validation
        </h3>
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-2 rounded-sm px-3 py-2"
          >
            {check.ok ? (
              <CheckCircle size={16} className="shrink-0 text-live" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-halt" />
            )}
            <span
              className={cn(
                "text-sm",
                check.ok ? "text-ink-muted" : "font-medium text-halt"
              )}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {warnings.map((warning) => (
        <p
          key={warning}
          className="mt-2 border border-hold/30 bg-hold-soft p-3 text-xs text-hold"
        >
          {warning}
        </p>
      ))}

      {errors.length > 0 && (
        <div className="mt-4 border border-halt/25 bg-halt-soft p-4">
          <p className="text-xs font-semibold text-halt tnum">
            {errors.length} issue(s) found
          </p>
          <ul className="mt-2 space-y-1">
            {errors.slice(0, 5).map((err, i) => (
              <li key={i} className="text-xs text-halt">
                {err.message}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-xs text-halt/70 tnum">
                …and {errors.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-sm border border-rule bg-slate-sunk p-4">
        <p className="text-xs text-ink-muted">
          {allValid
            ? "All checks passed. Your assignment is ready to publish."
            : "Fix the issues above before publishing."}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-ink-muted">
        <Save size={14} />
        <span>You can save as draft at any time and publish later.</span>
      </div>
    </div>
  );
}
