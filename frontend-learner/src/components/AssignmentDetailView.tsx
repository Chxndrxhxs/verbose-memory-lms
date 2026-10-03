import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  EXAM_MODULE_META,
  FileText,
  HelpCircle,
  type AssignmentDetail,
  type AssignmentModelPreview,
  type ExamModule,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { TopNav } from "./TopNav";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Panel } from "./Panel";

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-ink-muted hover:text-ink transition-colors",
);

type Props = {
  assignment: AssignmentDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  confirmingModel: AssignmentModelPreview | null;
  onStartRequest: (model: AssignmentModelPreview) => void;
  onCancelConfirm: () => void;
  onConfirmStart: (model: AssignmentModelPreview) => void;
  starting: boolean;
};

export function AssignmentDetailView({
  assignment,
  isLoading,
  error,
  confirmingModel,
  onStartRequest,
  onCancelConfirm,
  onConfirmStart,
  starting,
}: Props) {
  const [showInstructions, setShowInstructions] = useState(false);
  const startable =
    assignment?.models_preview.filter((m) => m.is_published) ?? [];

  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {isLoading && (
          <Panel className="p-10 text-sm text-ink-muted">
            Loading assignment…
          </Panel>
        )}
        {error && (
          <Panel className="p-10 text-sm text-halt">
            {error.message}
          </Panel>
        )}
        {assignment && (
          <div>
            <Panel className="p-8 sm:p-10">
              <Link to="/assignments" className={backLink}>
                <ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> All tests
              </Link>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {breadcrumb(assignment)}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-ink">
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="measure mt-2 font-serif text-sm leading-relaxed text-ink-muted">
                  {assignment.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="muted" showIcon={false} className="tnum">
                  <HelpCircle size={11} aria-hidden /> {assignment.questions_count} questions
                </Badge>
                <Badge tone="muted" showIcon={false} className="tnum">
                  <Clock size={11} aria-hidden /> {assignment.duration_label}
                </Badge>
                {assignment.negative_marking && (
                  <Badge tone="hold" showIcon={false} className="tnum">
                    −{assignment.negative_marks_per_wrong} per wrong answer
                  </Badge>
                )}
              </div>

              {assignment.instructions && (
                <div className="mt-4 border border-rule bg-room-sunk p-4">
                  <button
                    type="button"
                    onClick={() => setShowInstructions((v) => !v)}
                    aria-expanded={showInstructions}
                    className="flex w-full items-center gap-2 text-xs font-semibold text-ink"
                  >
                    <FileText size={13} className="shrink-0 text-ink-faint" aria-hidden />
                    Read before you start
                    <ChevronDown
                      size={13}
                      aria-hidden
                      className={cn(
                        "ml-auto transition-transform",
                        showInstructions && "rotate-180",
                      )}
                    />
                  </button>
                  {showInstructions && (
                    <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-ink-muted">
                      {assignment.instructions}
                    </p>
                  )}
                </div>
              )}
            </Panel>

            <h2 className="mt-8 px-1 text-sm font-semibold text-ink">Pick how to take it</h2>
            {startable.length === 0 ? (
              <Panel className="mt-3">
                <p className="text-sm text-ink-muted">
                  No modules are open for this test right now. Check back later.
                </p>
              </Panel>
            ) : (
              <div className="mt-3 grid gap-4">
                {startable.map((model) => (
                  <Panel key={model.id} className="flex flex-wrap items-center justify-between gap-4 p-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink">{model.name}</h3>
                        <Badge tone="muted" showIcon={false} className="bg-ink text-ink-inverse">
                          {moduleLabel(model.code)}
                        </Badge>
                      </div>
                      {model.description && (
                        <p className="measure mt-1 text-sm text-ink-muted">
                          {model.description}
                        </p>
                      )}
                      <p className="tnum mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} aria-hidden /> {model.duration_label}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HelpCircle size={12} aria-hidden /> {model.total_questions} questions
                        </span>
                      </p>
                    </div>
                    <Button variant="primary" onClick={() => onStartRequest(model)}>
                      Start
                    </Button>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        <Modal
          open={confirmingModel != null}
          onClose={onCancelConfirm}
          size="sm"
          title="Ready to begin?"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancelConfirm}>Not yet</Button>
              <Button
                variant="primary"
                onClick={() => confirmingModel && onConfirmStart(confirmingModel)}
                disabled={starting}
              >
                {starting ? (
                  "Starting…"
                ) : (
                  <>
                    <CheckCircle2 size={15} aria-hidden /> Begin {confirmingModel?.name}
                  </>
                )}
              </Button>
            </div>
          }
        >
          {confirmingModel && (
            <>
              <p className="text-sm leading-relaxed text-ink-muted">
                You are about to start <strong className="text-ink">{confirmingModel.name}</strong>{" "}
                for <strong className="text-ink">{assignment?.title}</strong>.{" "}
                {confirmingModel.code === "practice"
                  ? "Practice is untimed with inline explanations — learn at your own pace."
                  : "The timer starts right away and runs without pause. " +
                    "Once started you cannot pause it."}
              </p>
              {assignment?.instructions && (
                <div
                  className={cn(
                    "mt-4 border border-rule bg-room-sunk p-4 text-xs leading-relaxed",
                    "whitespace-pre-line text-ink-muted",
                  )}
                >
                  <p className="mb-1 font-semibold text-ink">Instructions</p>
                  <p>{assignment.instructions}</p>
                </div>
              )}
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}

function moduleLabel(code: string): string {
  if (code === "practice" || code === "mock") {
    return EXAM_MODULE_META[code as ExamModule].label;
  }
  return code;
}

function breadcrumb(assignment: AssignmentDetail): string {
  const inter = assignment.inter_category;
  if (!inter) return "Tests";
  const sub = inter.sub_category;
  const chain = [sub.category.name, sub.name, inter.name].filter(Boolean);
  return chain.join(" → ");
}
