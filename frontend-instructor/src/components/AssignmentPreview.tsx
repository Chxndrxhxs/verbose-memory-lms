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
    <div className="flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse tnum">
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
    <div className="border border-rule bg-slate-panel p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ink-inverse tnum">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{question.question}</p>
              <p className="mt-1 text-[10px] text-ink-faint tnum">
                {question.marks} mark{question.marks !== 1 ? "s" : ""}
              </p>
            </div>
            {question.questionImage && (
              <img
                src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                alt="Question figure"
                className="h-16 w-24 shrink-0 rounded-sm border border-rule bg-slate-panel object-contain"
              />
            )}
          </div>

          <div className="mt-3 space-y-2">
            {question.options.map((opt, i) => {
              const img = optionImage(opt);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                    selected === i
                      ? "border-ink bg-slate-sunk text-ink"
                      : "border-rule text-ink-muted hover:border-rule-strong hover:bg-slate-sunk"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tnum",
                      selected === i
                        ? "border-ink bg-ink text-ink-inverse"
                        : "border-rule-strong text-ink-muted"
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
                      className="h-16 w-24 shrink-0 rounded-sm border border-rule bg-slate-panel object-contain"
                    />
                  )}
                  <span className="min-w-0">{optionText(opt)}</span>
                </button>
              );
            })}
          </div>

          {question.explanation && (
            <div className="mt-3 border border-hold/30 bg-hold-soft p-3 text-xs text-hold">
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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Student view
      </p>
      <h2 className="mt-1 text-xl font-semibold text-ink">Student preview</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        Click through exactly as a student would.
      </p>

      <div className="mt-6 border border-rule bg-slate-sunk p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {assignment.title || "Untitled Assignment"}
            </h3>
            <p className="mt-0.5 text-xs text-ink-muted tnum">
              {MODEL_LABELS[assignment.modelType]} · {getTotalQuestions(assignment)}{" "}
              questions · {getTotalMarks(assignment)} marks
            </p>
          </div>
          <PreviewTimer key={current.key} minutes={current.minutes} />
        </div>

        {assignment.instructions && (
          <div className="mt-4 border border-rule bg-slate-panel p-3 text-sm text-ink-muted">
            {assignment.instructions}
          </div>
        )}
      </div>

      {sections.length > 1 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {sections.map((section, i) => (
            <button
              key={section.key}
              type="button"
              onClick={() => pickSection(i)}
              className={cn(
                "shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
                safeSection === i
                  ? "border-ink bg-ink text-ink-inverse"
                  : "border-rule bg-slate-sunk text-ink-muted hover:bg-slate-panel",
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
            "mt-4 flex flex-col items-center justify-center rounded-sm",
            "border border-dashed border-rule-strong py-10 text-center",
          )}
        >
          <AlertTriangle size={20} className="text-ink-faint" />
          <p className="mt-2 text-sm text-ink-muted">
            No questions to preview for this section.
          </p>
        </div>
      )}

      <div
        className={cn(
          "mt-4 flex items-center justify-between rounded-sm border border-rule bg-slate-sunk",
          "p-4 text-sm text-ink-muted",
        )}
      >
        <button
          type="button"
          onClick={() => setQIdx((i) => Math.max(0, i - 1))}
          disabled={safeQ <= 0}
          className="inline-flex items-center gap-2 text-xs text-ink-muted disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-xs text-ink-faint tnum">
          {currentQuestions.length > 0
            ? `Question ${safeQ + 1} of ${currentQuestions.length}`
            : "0 questions"}
        </span>
        <button
          type="button"
          onClick={() =>
            setQIdx((i) => Math.min(Math.max(0, currentQuestions.length - 1), i + 1))
          }
          disabled={safeQ >= currentQuestions.length - 1}
          className="inline-flex items-center gap-2 text-xs text-ink-muted disabled:opacity-30"
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
