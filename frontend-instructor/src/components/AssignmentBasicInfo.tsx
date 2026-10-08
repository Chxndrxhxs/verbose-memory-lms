import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import {
  builderCardClass,
  builderEyebrowClass,
  builderFieldClass,
  builderHintClass,
  builderLabelClass,
  builderSectionTitleClass,
} from "../lib/builder";
import { MAX_TOTAL_MARKS, MIN_TOTAL_MARKS } from "@masterlms/shared";
import type {
  Assignment,
  AssignmentValidationError,
} from "../types/assignment";
import { ExamBoardPicker } from "./ExamBoardPicker";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
  errors: AssignmentValidationError[];
};

const checkRow = cn(
  "flex items-center gap-3 rounded-sm border border-rule",
  "bg-slate-panel px-4 py-3",
);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-rule pt-6 first:border-t-0 first:pt-0">
      <h3 className={builderEyebrowClass}>{title}</h3>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

export function AssignmentBasicInfoStep({ assignment, onChange, errors }: Props) {
  return (
    <div className={builderCardClass}>
      <h2 className="text-xl font-semibold text-ink">About this assignment</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        What students see, when it runs, and how it scores.
      </p>

      <div className="mt-8 space-y-8">
        <Section title="1 · Details">
          <div>
            <label className={builderLabelClass} htmlFor="assignment-title">
              Title <span className="text-halt">*</span>
            </label>
            <input
              id="assignment-title"
              type="text"
              value={assignment.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Mid-term Assessment"
              className={builderFieldClass}
            />
          </div>

          <div>
            <label className={builderLabelClass} htmlFor="assignment-description">
              Description
            </label>
            <textarea
              id="assignment-description"
              value={assignment.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief description of this assignment…"
              rows={3}
              className={`${builderFieldClass} resize-none`}
            />
          </div>

          <div>
            <label className={builderLabelClass} htmlFor="assignment-instructions">
              Instructions for students
            </label>
            <textarea
              id="assignment-instructions"
              value={assignment.instructions}
              onChange={(e) => onChange({ instructions: e.target.value })}
              placeholder="What should students know before starting? (optional)"
              rows={3}
              className={`${builderFieldClass} resize-none`}
            />
          </div>

          <div>
            <ExamBoardPicker
              value={assignment.board}
              onChange={(v) => onChange({ board: v })}
              error={errors.find((e) => e.field === "board")?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={builderLabelClass}>Difficulty level</label>
              <select
                value={assignment.difficulty}
                onChange={(e) =>
                  onChange({
                    difficulty: e.target.value as Assignment["difficulty"],
                  })
                }
                className={builderFieldClass}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="2 · Schedule">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={builderLabelClass}>Duration (minutes)</label>
              <input
                type="number"
                min={1}
                value={assignment.duration}
                onChange={(e) =>
                  onChange({ duration: Math.max(1, Number(e.target.value) || 1) })
                }
                className={cn(builderFieldClass, "tnum")}
              />
            </div>
            <div>
              <label className={builderLabelClass}>Start (optional)</label>
              <input
                type="datetime-local"
                value={assignment.startDate || ""}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className={builderFieldClass}
              />
            </div>
            <div>
              <label className={builderLabelClass}>End (optional)</label>
              <input
                type="datetime-local"
                value={assignment.endDate || ""}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className={builderFieldClass}
              />
            </div>
          </div>
        </Section>

        <Section title="3 · Marking">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={builderLabelClass}>Total marks</label>
              <input
                type="number"
                min={MIN_TOTAL_MARKS}
                max={MAX_TOTAL_MARKS}
                value={assignment.totalMarks || ""}
                onChange={(e) =>
                  onChange({
                    // No <form> submit ever fires, so HTML5 min/max
                    // are advisory only — clamp here or 1e27-style
                    // typos reach the API (RAM-44).
                    totalMarks: Math.min(
                      MAX_TOTAL_MARKS,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  })
                }
                placeholder="Auto-sums from questions when published"
                className={cn(builderFieldClass, "tnum")}
              />
              <p className={builderHintClass}>
                {MIN_TOTAL_MARKS}–{MAX_TOTAL_MARKS}. Leave blank to auto-sum from
                questions.
              </p>
              {errors.find((e) => e.field === "totalMarks") && (
                <p className="mt-1 text-xs text-halt tnum">
                  {errors.find((e) => e.field === "totalMarks")?.message}
                </p>
              )}
            </div>

            <div>
              <label className={builderLabelClass}>Passing percentage</label>
              <input
                type="number"
                min={0}
                max={100}
                value={assignment.passingPercentage}
                onChange={(e) =>
                  onChange({
                    passingPercentage: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  })
                }
                className={cn(builderFieldClass, "tnum")}
              />
            </div>
          </div>

          <div className={cn(checkRow, "flex-wrap")}>
            <input
              type="checkbox"
              id="negative-marking"
              checked={assignment.negativeMarking}
              onChange={(e) =>
                onChange({ negativeMarking: e.target.checked })
              }
              className="h-4 w-4 rounded-sm border-rule-strong accent-ink"
            />
            <label htmlFor="negative-marking" className={builderSectionTitleClass}>
              Negative marking
            </label>
            <span className={builderHintClass}>Deduct marks for wrong answers.</span>
            {assignment.negativeMarking && (
              <input
                type="number"
                min={0}
                step={0.25}
                value={assignment.negativeMarks}
                onChange={(e) =>
                  onChange({
                    // The API rejects 0 while negative marking is
                    // on, so keep the deduction at the 0.25 step
                    // floor instead of saving a silent no-op.
                    negativeMarks: Math.max(
                      0.25,
                      Number(e.target.value) || 0
                    ),
                  })
                }
                placeholder="0.25"
                title="Marks deducted per wrong answer"
                className={cn(builderFieldClass, "mt-0 w-28 tnum")}
              />
            )}
          </div>
        </Section>

        <Section title="4 · Delivery">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className={checkRow}>
              <input
                type="checkbox"
                id="randomize-questions"
                checked={assignment.randomizeQuestions}
                onChange={(e) =>
                  onChange({ randomizeQuestions: e.target.checked })
                }
                className="h-4 w-4 rounded-sm border-rule-strong accent-ink"
              />
              <div>
                <label htmlFor="randomize-questions" className={builderSectionTitleClass}>
                  Shuffle question order
                </label>
                <p className={builderHintClass}>Each student sees a different order.</p>
              </div>
            </div>

            <div className={checkRow}>
              <input
                type="checkbox"
                id="randomize-options"
                checked={assignment.randomizeOptions}
                onChange={(e) =>
                  onChange({ randomizeOptions: e.target.checked })
                }
                className="h-4 w-4 rounded-sm border-rule-strong accent-ink"
              />
              <div>
                <label htmlFor="randomize-options" className={builderSectionTitleClass}>
                  Shuffle options
                </label>
                <p className={builderHintClass}>Each student sees options shuffled.</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
