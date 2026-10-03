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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Delivery format
      </p>
      <h2 className="mt-1 text-xl font-semibold text-ink">How students take it</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        One format per assignment. You can rearrange the tests in the next step.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {MODELS.map((model) => {
          const active = assignment.modelType === model;
          const Icon = MODEL_ICONS[model];
          return (
            <button
              key={model}
              type="button"
              onClick={() => onChange({ modelType: model })}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start rounded-sm border-2 p-6 text-left transition-colors",
                active
                  ? "border-ink bg-ink text-ink-inverse"
                  : "border-rule bg-slate-panel text-ink-muted hover:border-ink",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    active ? "bg-ink-inverse/20" : "bg-slate-sunk",
                  )}
                >
                  <Icon
                    size={20}
                    className={active ? "text-ink-inverse" : "text-ink-muted"}
                  />
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    active ? "bg-ink-inverse text-ink" : "bg-slate-sunk text-transparent",
                  )}
                >
                  ✓
                </span>
              </div>
              <p className="mt-4 text-[15px] font-semibold">{MODEL_LABELS[model]}</p>
              <p
                className={cn(
                  "mt-1.5 text-sm leading-relaxed",
                  active ? "text-ink-inverse/70" : "text-ink-muted",
                )}
              >
                {MODEL_DESCRIPTIONS[model]}
              </p>
              <p
                className={cn(
                  "mt-4 text-xs font-semibold tnum",
                  active ? "text-ink-inverse/80" : "text-ink-faint",
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
