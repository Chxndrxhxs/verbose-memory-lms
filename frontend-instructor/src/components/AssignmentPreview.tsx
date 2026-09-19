import { useState } from "react";
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type { Assignment } from "../types/assignment";
import { MODEL_LABELS, getTotalQuestions, getTotalMarks } from "../types/assignment";

type Props = {
  assignment: Assignment;
};

function PreviewTimer({ duration }: { duration: number }) {
  const [remaining] = useState(duration * 60);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return (
    <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white">
      <Clock size={14} />
      <span>
        {h > 0 ? `${h}:` : ""}
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

function PreviewQuestionCard({
  question,
  index,
}: {
  question: Assignment["questions"][0];
  index: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const letterFor = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{question.question}</p>
              <p className="mt-1 text-[10px] text-zinc-400">
                {question.marks} mark{question.marks !== 1 ? "s" : ""}
              </p>
            </div>
            {question.questionImage && (
              <img
                src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                alt="Question figure"
                className="h-16 w-24 shrink-0 rounded-lg border border-zinc-200 object-cover"
              />
            )}
          </div>

          <div className="mt-3 space-y-2">
            {question.options.map((opt, i) => {
              const img = optionImage(opt);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    selected === i
                      ? "border-[#3478ff] bg-blue-50 text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      selected === i
                        ? "border-[#3478ff] bg-[#3478ff] text-white"
                        : "border-zinc-300 text-zinc-500"
                    )}
                  >
                    {selected === i ? (
                      <span className="text-[10px]">✓</span>
                    ) : (
                      letterFor(i)
                    )}
                  </span>
                  {img && (
                    <img
                      src={absoluteMediaUrl(img) ?? img}
                      alt={optionText(opt)}
                      className="h-12 w-16 shrink-0 rounded-md border border-zinc-200 object-cover"
                    />
                  )}
                  <span className="min-w-0">{optionText(opt)}</span>
                </button>
              );
            })}
          </div>

          {question.explanation && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <strong>Explanation:</strong> {question.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AssignmentPreviewStep({ assignment }: Props) {
  const [previewNav, setPreviewNav] = useState({ testIdx: 0, setIdx: 0, qIdx: 0 });

  const getPreviewQuestions = () => {
    if (assignment.modelType === "model_1") {
      return assignment.questions;
    }
    const test = assignment.tests[previewNav.testIdx];
    if (!test) return [];
    if (assignment.modelType === "model_2") {
      return test.questions;
    }
    const set = test.sets[previewNav.setIdx];
    return set?.questions ?? [];
  };

  const previewQuestions = getPreviewQuestions();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Student Preview</h2>
      <p className="mt-1 text-sm text-zinc-500">
        This is how students will see the assignment.
      </p>

      <div className="mt-4 rounded-xl bg-[#f6f5f1] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              {assignment.title || "Untitled Assignment"}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {MODEL_LABELS[assignment.modelType]} · {getTotalQuestions(assignment)} questions ·{" "}
              {getTotalMarks(assignment)} marks
            </p>
          </div>
          <PreviewTimer duration={assignment.duration} />
        </div>

        {assignment.instructions && (
          <div className="mt-4 rounded-lg bg-white p-3 text-sm text-zinc-600">
            {assignment.instructions}
          </div>
        )}
      </div>

      {assignment.modelType !== "model_1" && assignment.tests.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {assignment.tests.map((test, i) => (
              <button
                key={test.id}
                onClick={() =>
                  setPreviewNav({ testIdx: i, setIdx: 0, qIdx: 0 })
                }
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  previewNav.testIdx === i
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {test.title}
              </button>
            ))}
          </div>

          {assignment.modelType === "model_3" &&
            assignment.tests[previewNav.testIdx]?.sets.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
                {assignment.tests[previewNav.testIdx].sets.map((set, i) => (
                  <button
                    key={set.id}
                    onClick={() =>
                      setPreviewNav((p) => ({ ...p, setIdx: i, qIdx: 0 }))
                    }
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors",
                      previewNav.setIdx === i
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {set.title}
                  </button>
                ))}
              </div>
            )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {previewQuestions.map((q, i) => (
          <PreviewQuestionCard key={q.id} question={q} index={i} />
        ))}
      </div>

      {previewQuestions.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-10 text-center">
          <AlertTriangle size={20} className="text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-500">
            No questions to preview for this section.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
        <button className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs text-zinc-400">
          {previewQuestions.length > 0
            ? `Question ${previewNav.qIdx + 1} of ${previewQuestions.length}`
            : "0 questions"}
        </span>
        <button className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
