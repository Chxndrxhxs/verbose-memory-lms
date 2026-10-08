import { useState } from "react";
import { ArrowLeft, ArrowRight, isValidTotalMarks, Save, Check } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import type {
  Assignment,
  AssignmentValidationError,
} from "../types/assignment";
import { MODEL_LABELS, getTotalQuestions } from "../types/assignment";
import { AssignmentBasicInfoStep } from "./AssignmentBasicInfo";
import { AssignmentPdfUploadStep } from "./AssignmentPdfUpload";
import { AssignmentGenerateStep } from "./AssignmentGenerate";
import { AssignmentQuestionReviewStep } from "./AssignmentQuestionReview";
import { AssignmentModelSelectStep } from "./AssignmentModelSelect";
import { AssignmentTestConfigStep } from "./AssignmentTestConfig";
import { AssignmentPreviewStep } from "./AssignmentPreview";
import { AssignmentPublishStep } from "./AssignmentPublish";

const STEP_LABELS = [
  "Basic Info",
  "Upload PDF",
  "Generate",
  "Review",
  "Model",
  "Configure",
  "Preview",
  "Publish",
];

type Props = {
  assignment: Assignment;
  onAssignmentChange: (a: Assignment) => void;
  onSave: (publish: boolean) => void;
  onPersistDraft: () => Promise<string | null>;
  saving: boolean;
  errors: AssignmentValidationError[];
  isEditing?: boolean;
};

export function AssignmentWizard({
  assignment,
  onAssignmentChange,
  onSave,
  onPersistDraft,
  saving,
  errors,
  isEditing: _isEditing,
}: Props) {
  const [step, setStep] = useState(0);
  const questionCount = getTotalQuestions(assignment);

  // Step captions stay short: a long or junk title would otherwise
  // spill into the wizard chrome.
  const captionTitle = (raw: string) => {
    const t = raw.trim();
    if (!t) return "Missing title";
    return t.length > 24 ? `${t.slice(0, 24)}…` : t;
  };

  const captions = [
    captionTitle(assignment.title),
    assignment.sourceDocumentName || "Optional",
    `${assignment.questions.length} in pool`,
    `${questionCount} question${questionCount === 1 ? "" : "s"}`,
    MODEL_LABELS[assignment.modelType],
    assignment.modelType === "practice"
      ? "Not needed"
      : `${assignment.tests.length} test${assignment.tests.length === 1 ? "" : "s"}`,
    "Student view",
    errors.length === 0 ? "Ready" : `${errors.length} issues`,
  ];

  const blockers: (string | null)[] = [
    assignment.title.trim() ? null : "Add a title to continue.",
    assignment.board == null ? null : "Pick an exam board to continue.",
    isValidTotalMarks(assignment.totalMarks)
      ? null
      : "Total marks looks unrealistic — check the value.",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  const blocker = blockers[step];

  const advance = async () => {
    if (blocker) return;
    if (step < STEP_LABELS.length - 1) {
      const saved = await onPersistDraft();
      if (!saved) return;
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleStepChange = (patch: Partial<Assignment>) => {
    onAssignmentChange({ ...assignment, ...patch });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <AssignmentBasicInfoStep
            assignment={assignment}
            onChange={handleStepChange}
            errors={errors}
          />
        );
      case 1:
        return (
          <AssignmentPdfUploadStep
            assignment={assignment}
            onChange={handleStepChange}
          />
        );
      case 2:
        return (
          <AssignmentGenerateStep
            assignment={assignment}
            onChange={handleStepChange}
          />
        );
      case 3:
        return (
          <AssignmentQuestionReviewStep
            assignment={assignment}
            onChange={handleStepChange}
          />
        );
      case 4:
        return (
          <AssignmentModelSelectStep
            assignment={assignment}
            onChange={handleStepChange}
          />
        );
      case 5:
        return (
          <AssignmentTestConfigStep
            assignment={assignment}
            onChange={handleStepChange}
          />
        );
      case 6:
        return <AssignmentPreviewStep assignment={assignment} />;
      case 7:
        return (
          <AssignmentPublishStep
            assignment={assignment}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className={builderCardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {assignment.id ? "Edit assignment" : "New assignment"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {assignment.title.trim() || "Untitled assignment"}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted tnum">
          Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
        </p>
        <ol className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          {STEP_LABELS.map((label, i) => {
            const active = i === step;
            const completed = i < step;
            return (
              <li key={label} className="flex shrink-0 items-center gap-2">
                {i > 0 && <span className="h-px w-4 bg-rule-strong" aria-hidden />}
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (i <= step || (i <= step + 1 && !blocker)) setStep(i);
                  }}
                  title={captions[i]}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-ink bg-ink text-ink-inverse"
                      : completed
                        ? "border-live/25 bg-live-soft hover:border-live/50"
                        : "border-rule bg-slate-panel hover:border-rule-strong",
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-semibold whitespace-nowrap tnum",
                      active
                        ? "text-ink-inverse"
                        : completed
                          ? "text-live"
                          : "text-ink",
                    )}
                  >
                    {i + 1}. {label}
                  </span>
                  <span
                    className={cn(
                      "block max-w-32 truncate text-[11px] tnum",
                      active ? "text-ink-inverse/70" : "text-ink-muted",
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

      <div className="min-h-[60vh]">{renderStep()}</div>

      <div className={cn(builderCardClass, "flex items-center justify-between gap-3 !p-4 sm:!p-5")}>
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border border-rule",
            "px-4 py-2 text-sm font-semibold text-ink-muted transition-colors",
            "hover:bg-slate-sunk disabled:opacity-40",
          )}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border border-rule",
              "px-4 py-2 text-sm font-semibold text-ink-muted transition-colors",
              "hover:bg-slate-sunk disabled:opacity-50",
            )}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save draft"}
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <span className="inline-flex items-center gap-2">
              {blocker && (
                <span className="hidden text-xs text-ink-faint sm:block">
                  {blocker}
                </span>
              )}
              <button
                type="button"
                onClick={advance}
                disabled={Boolean(blocker) || saving}
                title={blocker ?? "Save and continue"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-sm bg-ink",
                  "px-4 py-2 text-sm font-semibold text-ink-inverse",
                  "transition-opacity hover:opacity-90 disabled:opacity-40",
                )}
              >
                {saving ? "Saving…" : "Next"} <ArrowRight size={14} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSave(true)}
              disabled={saving || errors.length > 0}
              title={
                errors.length > 0
                  ? `${errors.length} issues to fix first`
                  : "Publish for students"
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border border-live bg-live",
                "px-5 py-2 text-sm font-semibold text-ink-inverse",
                "transition-colors hover:bg-live/88 disabled:opacity-50",
              )}
            >
              <Check size={14} /> Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
