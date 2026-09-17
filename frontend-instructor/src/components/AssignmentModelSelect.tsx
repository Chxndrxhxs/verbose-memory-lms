import { Layers, ListChecks, Network } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type { Assignment, AssignmentModelType } from "../types/assignment";
import { MODEL_LABELS, MODEL_DESCRIPTIONS } from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

const MODEL_ICONS: Record<AssignmentModelType, typeof Layers> = {
  model_1: ListChecks,
  model_2: Layers,
  model_3: Network,
};

export function AssignmentModelSelectStep({ assignment, onChange }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Select Assignment Model</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Choose how questions are organized in this assignment.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["model_1", "model_2", "model_3"] as AssignmentModelType[]).map(
          (model) => {
            const active = assignment.modelType === model;
            const Icon = MODEL_ICONS[model];
            return (
              <button
                key={model}
                onClick={() => onChange({ modelType: model })}
                className={cn(
                  "flex flex-col items-start rounded-xl border-2 p-5 text-left transition-all",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    active ? "bg-white/20" : "bg-zinc-100"
                  )}
                >
                  <Icon
                    size={20}
                    className={active ? "text-white" : "text-zinc-600"}
                  />
                </div>
                <p className="mt-3 text-sm font-bold">{MODEL_LABELS[model]}</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-relaxed",
                    active ? "text-white/70" : "text-zinc-500"
                  )}
                >
                  {MODEL_DESCRIPTIONS[model]}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                      active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"
                    )}
                  >
                    {model === "model_1" ? "1" : model === "model_2" ? "2" : "3"}
                  </span>
                  <span className={cn("text-xs", active ? "text-white/60" : "text-zinc-400")}>
                    Level
                  </span>
                </div>
              </button>
            );
          }
        )}
      </div>

      {assignment.modelType === "model_1" && (
        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-800">Model 1 — Direct MCQ</p>
          <p className="mt-1 text-xs text-blue-600">
            Questions are placed directly under the assignment. Best for simple quizzes and
            assessments with a single set of questions.
          </p>
        </div>
      )}
      {assignment.modelType === "model_2" && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800">Model 2 — Tests</p>
          <p className="mt-1 text-xs text-amber-600">
            Organize questions into separate tests, each with its own duration and settings.
            Useful for multi-part assessments.
          </p>
        </div>
      )}
      {assignment.modelType === "model_3" && (
        <div className="mt-4 rounded-xl bg-purple-50 p-4">
          <p className="text-xs font-semibold text-purple-800">Model 3 — Tests &amp; Sets</p>
          <p className="mt-1 text-xs text-purple-600">
            Each test can contain multiple sets with independent durations. Ideal for
            adaptive assessments or randomized test variants.
          </p>
        </div>
      )}
    </div>
  );
}
