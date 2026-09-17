import { CheckCircle, AlertCircle, Save } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type {
  Assignment,
  AssignmentValidationError,
} from "../types/assignment";
import { MODEL_LABELS, getTotalQuestions, getTotalMarks } from "../types/assignment";

type Props = {
  assignment: Assignment;
  errors: AssignmentValidationError[];
};

export function AssignmentPublishStep({ assignment, errors }: Props) {
  const checks = [
    {
      label: "Title provided",
      ok: Boolean(assignment.title.trim()),
    },
    {
      label: "Source PDF uploaded",
      ok: Boolean(assignment.sourceDocument || assignment.sourceDocumentName),
    },
    {
      label: "At least one question",
      ok:
        getTotalQuestions(assignment) > 0 ||
        (assignment.modelType !== "model_1" && assignment.tests.length > 0),
    },
    {
      label: "All questions have valid options",
      ok: errors.filter((e) => e.field.startsWith("options_")).length === 0,
    },
    {
      label: "All questions have a correct answer",
      ok: errors.filter((e) => e.field.startsWith("correct_")).length === 0,
    },
    ...(assignment.modelType === "model_2"
      ? [
          {
            label: "At least one test",
            ok: assignment.tests.length > 0,
          },
        ]
      : []),
    ...(assignment.modelType === "model_3"
      ? [
          {
            label: "Tests have sets",
            ok:
              assignment.model3Tests.length > 0 &&
              assignment.model3Tests.every((test) => test.sets.length > 0),
          },
          {
            label: "All sets contain questions",
            ok: assignment.model3Tests.every((t) =>
              t.sets.every((s) => s.questions.length > 0)
            ),
          },
        ]
      : []),
  ];

  const allValid = checks.every((c) => c.ok);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Review & Publish</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Final check before publishing your assignment.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-bold text-zinc-900">
          {assignment.title || "Untitled Assignment"}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-zinc-600 sm:grid-cols-4">
          <div>
            <span className="text-zinc-400">Model:</span>{" "}
            {MODEL_LABELS[assignment.modelType]}
          </div>
          <div>
            <span className="text-zinc-400">Questions:</span>{" "}
            {getTotalQuestions(assignment)}
          </div>
          <div>
            <span className="text-zinc-400">Total marks:</span>{" "}
            {getTotalMarks(assignment) || assignment.totalMarks}
          </div>
          <div>
            <span className="text-zinc-400">Duration:</span>{" "}
            {assignment.duration} min
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Validation
        </h3>
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2"
          >
            {check.ok ? (
              <CheckCircle size={16} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-500" />
            )}
            <span
              className={cn(
                "text-sm",
                check.ok ? "text-zinc-700" : "font-medium text-red-600"
              )}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-xl bg-red-50 p-4">
          <p className="text-xs font-semibold text-red-800">
            {errors.length} issue(s) found
          </p>
          <ul className="mt-2 space-y-1">
            {errors.slice(0, 5).map((err, i) => (
              <li key={i} className="text-xs text-red-600">
                {err.message}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-xs text-red-400">
                …and {errors.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-zinc-50 p-4">
        <p className="text-xs text-zinc-600">
          {allValid
            ? "All checks passed. Your assignment is ready to publish."
            : "Fix the issues above before publishing."}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
        <Save size={14} />
        <span>You can save as draft at any time and publish later.</span>
      </div>
    </div>
  );
}
