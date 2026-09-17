import { useState } from "react";
import { ArrowLeft, ArrowRight, Save, Eye, Check } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type { Assignment, AssignmentValidationError } from "../types/assignment";
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

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return Boolean(assignment.title.trim());
      case 1:
        return Boolean(assignment.sourceDocument || assignment.sourceDocumentName);
      default:
        return true;
    }
  };

  const advance = async () => {
    if (step < STEP_LABELS.length - 1 && canAdvance()) {
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
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
        <div className="flex min-w-max gap-0.5">
          {STEP_LABELS.map((label, i) => {
            const active = i === step;
            const completed = i < step;
            return (
              <button
                key={label}
                onClick={() => {
                  if (i <= step || (i <= step + 1 && canAdvance())) setStep(i);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                  active
                    ? "bg-[#0f172a] text-white shadow"
                    : completed
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-200 text-zinc-500"
                  )}
                >
                  {completed ? <Check size={10} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[60vh]">{renderStep()}</div>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <Save size={14} /> Save draft
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <button
              onClick={advance}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => onSave(true)}
              disabled={saving || errors.length > 0}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-emerald-700 disabled:opacity-50"
            >
              <Eye size={14} /> Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
