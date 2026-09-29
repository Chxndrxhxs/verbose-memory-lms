import { useEffect, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import type { Assignment } from "../types/assignment";
import { MODEL_LABELS, getTotalQuestions, getTotalMarks } from "../types/assignment";

type Props = {
  assignment: Assignment;
};

function PreviewTimer({ minutes }: { minutes: number }) {
  const total = Math.max(0, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState(total);
  useEffect(() => {
    if (total <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [total]);
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
                className="h-16 w-24 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain"
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
                      className="h-16 w-24 shrink-0 rounded-md border border-zinc-200 bg-white object-contain"
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
  const sections = getPreviewSections(assignment);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const safeSection = Math.min(sectionIdx, Math.max(0, sections.length - 1));
  const current = sections[safeSection] ?? {
    key: "empty",
    label: "",
    minutes: 0,
    questions: [] as Assignment["questions"],
  };
  const currentQuestions = current.questions;
  const safeQ = Math.min(qIdx, Math.max(0, currentQuestions.length - 1));
  const active = currentQuestions[safeQ];

  const pickSection = (i: number) => {
    setSectionIdx(i);
    setQIdx(0);
  };

  return (
    <div className={builderCardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
        Student view
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">Student preview</h2>
      <p className="mt-1.5 text-[15px] text-zinc-500">
        Click through exactly as a student would.
      </p>

      <div className="mt-6 rounded-2xl bg-[#f6f5f1] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              {assignment.title || "Untitled Assignment"}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {MODEL_LABELS[assignment.modelType]} · {getTotalQuestions(assignment)}{" "}
              questions · {getTotalMarks(assignment)} marks
            </p>
          </div>
          <PreviewTimer key={current.key} minutes={current.minutes} />
        </div>

        {assignment.instructions && (
          <div className="mt-4 rounded-lg bg-white p-3 text-sm text-zinc-600">
            {assignment.instructions}
          </div>
        )}
      </div>

      {sections.length > 1 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {sections.map((section, i) => (
            <button
              key={section.key}
              onClick={() => pickSection(i)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                safeSection === i
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <div className="mt-4">
          <PreviewQuestionCard key={active.id} question={active} index={safeQ} />
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 flex flex-col items-center justify-center rounded-xl",
            "border border-dashed border-zinc-300 py-10 text-center",
          )}
        >
          <AlertTriangle size={20} className="text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-500">
            No questions to preview for this section.
          </p>
        </div>
      )}

      <div
        className={cn(
          "mt-4 flex items-center justify-between rounded-xl bg-zinc-50",
          "p-4 text-sm text-zinc-600",
        )}
      >
        <button
          onClick={() => setQIdx((i) => Math.max(0, i - 1))}
          disabled={safeQ <= 0}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs text-zinc-400">
          {currentQuestions.length > 0
            ? `Question ${safeQ + 1} of ${currentQuestions.length}`
            : "0 questions"}
        </span>
        <button
          onClick={() =>
            setQIdx((i) => Math.min(Math.max(0, currentQuestions.length - 1), i + 1))
          }
          disabled={safeQ >= currentQuestions.length - 1}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 disabled:opacity-30"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function getPreviewSections(assignment: Assignment): {
  key: string;
  label: string;
  minutes: number;
  questions: Assignment["questions"];
}[] {
  if (assignment.modelType === "practice" || assignment.tests.length === 0) {
    return [
      {
        key: "pool",
        label: MODEL_LABELS[assignment.modelType],
        minutes: assignment.duration,
        questions: assignment.questions,
      },
    ];
  }
  if (assignment.modelType === "mock") {
    return assignment.tests.map((test) => ({
      key: test.id,
      label: test.title,
      minutes: test.duration,
      questions: test.questions,
    }));
  }
  return [
    {
      key: "pool",
      label: MODEL_LABELS[assignment.modelType],
      minutes: assignment.duration,
      questions: assignment.questions,
    },
  ];
}
