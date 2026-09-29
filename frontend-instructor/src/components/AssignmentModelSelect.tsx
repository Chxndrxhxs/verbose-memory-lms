import { Layers, ListChecks } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import type { Assignment, AssignmentModelType } from "../types/assignment";
import {
  MODEL_LABELS,
  MODEL_DESCRIPTIONS,
  buildMockFromQuestions,
} from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

const MODEL_ICONS: Record<AssignmentModelType, typeof Layers> = {
  practice: ListChecks,
  mock: Layers,
};

const MODELS: AssignmentModelType[] = ["practice", "mock"] as const;

export function AssignmentModelSelectStep({ assignment, onChange }: Props) {
  const poolCount = assignment.questions.length;
  const mockTests = buildMockFromQuestions(assignment.questions, assignment.duration);

  const mockUnit = mockTests.length === 1 ? "section" : "sections";
  const plan: Record<AssignmentModelType, string> =
    poolCount === 0
      ? {
          practice: "Your questions stay in one untimed set.",
          mock: "Each category (Quant, English, …) becomes a timed section.",
        }
      : {
          practice: `${poolCount} question${poolCount === 1 ? "" : "s"} in one untimed set.`,
          mock: `${mockTests.length} timed ${mockUnit}, split by category (max 12 each).`,
        };

  return (
    <div className={builderCardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
        Delivery format
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">How students take it</h2>
      <p className="mt-1.5 text-[15px] text-zinc-500">
        One format per assignment. You can rearrange the tests in the next step.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {MODELS.map((model) => {
          const active = assignment.modelType === model;
          const Icon = MODEL_ICONS[model];
          return (
            <button
              key={model}
              onClick={() => onChange({ modelType: model })}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start rounded-2xl border-2 p-6 text-left transition-all",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-lg"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    active ? "bg-white/20" : "bg-zinc-100",
                  )}
                >
                  <Icon
                    size={20}
                    className={active ? "text-white" : "text-zinc-600"}
                  />
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    active ? "bg-white text-zinc-900" : "bg-zinc-100 text-transparent",
                  )}
                >
                  ✓
                </span>
              </div>
              <p className="mt-4 text-[15px] font-bold">{MODEL_LABELS[model]}</p>
              <p
                className={cn(
                  "mt-1.5 text-sm leading-relaxed",
                  active ? "text-white/70" : "text-zinc-500",
                )}
              >
                {MODEL_DESCRIPTIONS[model]}
              </p>
              <p
                className={cn(
                  "mt-4 text-xs font-semibold",
                  active ? "text-white/80" : "text-zinc-400",
                )}
              >
                {plan[model]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
