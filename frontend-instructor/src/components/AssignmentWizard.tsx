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

  const captions = [
    assignment.title.trim() || "Missing title",
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
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
          {assignment.id ? "Edit assignment" : "New assignment"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[28px]">
          {assignment.title.trim() || "Untitled assignment"}
        </h1>
        <p className="mt-1 text-[15px] text-zinc-500">
          Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
        </p>
        <ol className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          {STEP_LABELS.map((label, i) => {
            const active = i === step;
            const completed = i < step;
            return (
              <li key={label} className="flex shrink-0 items-center gap-2">
                {i > 0 && <span className="h-px w-3 bg-zinc-300" aria-hidden />}
                <button
                  key={label}
                  onClick={() => {
                    if (i <= step || (i <= step + 1 && !blocker)) setStep(i);
                  }}
                  title={captions[i]}
                  className={cn(
                    "rounded-2xl border px-3.5 py-2 text-left transition-all",
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : completed
                        ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                        : "border-zinc-200 bg-white hover:border-zinc-400",
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-bold whitespace-nowrap",
                      active
                        ? "text-white"
                        : completed
                          ? "text-emerald-800"
                          : "text-zinc-900",
                    )}
                  >
                    {i + 1}. {label}
                  </span>
                  <span
                    className={cn(
                      "block max-w-32 truncate text-[11px]",
                      active ? "text-white/70" : "text-zinc-500",
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
          onClick={goBack}
          disabled={step === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-zinc-200",
            "px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors",
            "hover:bg-zinc-50 disabled:opacity-40",
          )}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(false)}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-zinc-200",
              "px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors",
              "hover:bg-zinc-50 disabled:opacity-50",
            )}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save draft"}
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <span className="inline-flex items-center gap-2">
              {blocker && (
                <span className="hidden text-xs text-zinc-400 sm:block">
                  {blocker}
                </span>
              )}
              <button
                onClick={advance}
                disabled={Boolean(blocker) || saving}
                title={blocker ?? "Save and continue"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-[#0f172a]",
                  "px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
                  "transition-opacity hover:opacity-90 disabled:opacity-40",
                )}
              >
                {saving ? "Saving…" : "Next"} <ArrowRight size={14} />
              </button>
            </span>
          ) : (
            <button
              onClick={() => onSave(true)}
              disabled={saving || errors.length > 0}
              title={
                errors.length > 0
                  ? `${errors.length} issues to fix first`
                  : "Publish for students"
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-emerald-600",
                "px-5 py-2.5 text-sm font-semibold text-white shadow-sm",
                "transition-opacity hover:bg-emerald-700 disabled:opacity-50",
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
