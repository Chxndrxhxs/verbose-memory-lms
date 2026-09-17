import type { Assignment } from "../types/assignment";
import { getCourseOptions } from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

export function AssignmentBasicInfoStep({ assignment, onChange }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Basic Information</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Define the assignment details students will see.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={assignment.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Mid-term Assessment"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Description
          </label>
          <textarea
            value={assignment.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief description of this assignment…"
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600">
            Instructions
          </label>
          <textarea
            value={assignment.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="Instructions for students (optional)…"
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Subject / Course
            </label>
            <select
              value={assignment.course}
              onChange={(e) => onChange({ course: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
            >
              <option value="">Select a course</option>
              {getCourseOptions().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Difficulty Level
            </label>
            <select
              value={assignment.difficulty}
              onChange={(e) =>
                onChange({
                  difficulty: e.target.value as Assignment["difficulty"],
                })
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Total Marks
            </label>
            <input
              type="number"
              min={1}
              value={assignment.totalMarks || ""}
              onChange={(e) =>
                onChange({ totalMarks: Number(e.target.value) || 0 })
              }
              placeholder="e.g. 100"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Total Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={assignment.duration}
              onChange={(e) =>
                onChange({ duration: Math.max(1, Number(e.target.value) || 1) })
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Passing Percentage (%)
            </label>
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
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              Start Date (optional)
            </label>
            <input
              type="datetime-local"
              value={assignment.startDate || ""}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600">
              End Date (optional)
            </label>
            <input
              type="datetime-local"
              value={assignment.endDate || ""}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <input
              type="checkbox"
              id="randomize-questions"
              checked={assignment.randomizeQuestions}
              onChange={(e) =>
                onChange({ randomizeQuestions: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <label htmlFor="randomize-questions" className="text-sm text-zinc-700">
              Randomize question order
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
            <input
              type="checkbox"
              id="randomize-options"
              checked={assignment.randomizeOptions}
              onChange={(e) =>
                onChange({ randomizeOptions: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <label htmlFor="randomize-options" className="text-sm text-zinc-700">
              Randomize option order
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
          <input
            type="checkbox"
            id="negative-marking"
            checked={assignment.negativeMarking}
            onChange={(e) =>
              onChange({ negativeMarking: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
          />
          <label htmlFor="negative-marking" className="text-sm text-zinc-700">
            Enable negative marking
          </label>
          {assignment.negativeMarking && (
            <input
              type="number"
              min={0}
              step={0.25}
              value={assignment.negativeMarks}
              onChange={(e) =>
                onChange({ negativeMarks: Number(e.target.value) || 0 })
              }
              placeholder="0.25"
              className="ml-2 w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900"
            />
          )}
        </div>
      </div>
    </div>
  );
}
