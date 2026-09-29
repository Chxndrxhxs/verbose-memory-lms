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

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-zinc-500 hover:text-zinc-900",
);

const metaPill =
  "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1";

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
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        {isLoading && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-zinc-500">
            Loading assignment…
          </div>
        )}
        {error && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-red-600">
            {error.message}
          </div>
        )}
        {assignment && (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
              <Link to="/assignments" className={backLink}>
                <ArrowLeft size={14} strokeWidth={2.5} /> All tests
              </Link>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {breadcrumb(assignment)}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {assignment.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className={metaPill}>
                  <HelpCircle size={13} /> {assignment.questions_count} questions
                </span>
                <span className={metaPill}>
                  <Clock size={13} /> {assignment.duration_label}
                </span>
                {assignment.negative_marking && (
                  <span className={cn(metaPill, "bg-amber-50 text-amber-800")}>
                    −{assignment.negative_marks_per_wrong} per wrong answer
                  </span>
                )}
              </div>

              {assignment.instructions && (
                <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                  <button
                    onClick={() => setShowInstructions((v) => !v)}
                    className="flex w-full items-center gap-2 text-xs font-bold text-zinc-700"
                  >
                    <FileText size={13} className="shrink-0 text-zinc-400" />
                    Read before you start
                    <ChevronDown
                      size={13}
                      className={cn(
                        "ml-auto transition-transform",
                        showInstructions && "rotate-180",
                      )}
                    />
                  </button>
                  {showInstructions && (
                    <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-zinc-600">
                      {assignment.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            <h2 className="mt-8 px-2 text-sm font-bold">Pick how to take it</h2>
            {startable.length === 0 ? (
              <p className="mt-3 rounded-[24px] border bg-white p-6 text-sm text-zinc-500">
                No modules are open for this test right now. Check back later.
              </p>
            ) : (
              <div className="mt-3 grid gap-4">
                {startable.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4",
                      "rounded-[24px] border bg-white p-6",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold">{model.name}</h3>
                        <span
                          className={cn(
                            "rounded-full bg-zinc-900 px-2.5 py-0.5",
                            "text-[11px] font-semibold text-white",
                          )}
                        >
                          {moduleLabel(model.code)}
                        </span>
                      </div>
                      {model.description && (
                        <p className="mt-1 text-sm text-zinc-500">
                          {model.description}
                        </p>
                      )}
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {model.duration_label}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <HelpCircle size={12} /> {model.total_questions} questions
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => onStartRequest(model)}
                      className={cn(
                        "rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold",
                        "text-white transition hover:bg-zinc-800",
                      )}
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {confirmingModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <h3 className="text-lg font-bold">Ready to begin?</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                You are about to start <strong>{confirmingModel.name}</strong>{" "}
                for <strong>{assignment?.title}</strong>.{" "}
                {confirmingModel.code === "practice"
                  ? "Practice is untimed with inline explanations — learn at your own pace."
                  : "The timer starts right away and runs without pause. " +
                    "Once started you cannot pause it."}
              </p>
              {assignment?.instructions && (
                <div
                  className={cn(
                    "mt-4 rounded-2xl bg-zinc-50 p-4 text-xs leading-relaxed",
                    "whitespace-pre-line text-zinc-600",
                  )}
                >
                  <p className="mb-1 font-semibold text-zinc-800">Instructions</p>
                  <p>{assignment.instructions}</p>
                </div>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={onCancelConfirm}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold text-zinc-600",
                    "hover:text-zinc-900",
                  )}
                >
                  Not yet
                </button>
                <button
                  onClick={() => onConfirmStart(confirmingModel)}
                  disabled={starting}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-emerald-600",
                    "px-5 py-2.5 text-sm font-semibold text-white transition",
                    "hover:bg-emerald-700 disabled:opacity-60",
                  )}
                >
                  {starting ? (
                    "Starting…"
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Begin {confirmingModel.name}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
