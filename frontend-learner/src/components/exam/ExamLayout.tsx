import type { ReactNode } from "react";
import type { QuestionRow, QuestionSection } from "./types";
import { QuestionPanel } from "./QuestionPanel";
import { QuestionPalette } from "./QuestionPalette";
import type { Counts } from "./types";

export function ExamLayout({
  current,
  questions,
  sections,
  counts,
  currentIndex,
  currentSectionIndex,
  markedForReview,
  onSelect,
  onMarkForReview,
  onClear,
  onPrevious,
  onNext,
  onSelectPalette,
  onSubmit,
  onExit,
  submitting,
  practice,
}: {
  current: QuestionRow;
  questions: QuestionRow[];
  sections: QuestionSection[];
  counts: Counts;
  currentIndex: number;
  currentSectionIndex: number;
  markedForReview: boolean;
  onSelect: (index: number) => void;
  onMarkForReview: () => void;
  onClear: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectPalette: (index: number) => void;
  onSubmit: () => void;
  onExit: () => void;
  submitting: boolean;
  practice: boolean;
}) {
  const showExplanation = practice && current.selected !== undefined;

  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <QuestionPanel
        current={current}
        currentIndex={currentIndex}
        questions={questions}
        markedForReview={markedForReview}
        onSelect={onSelect}
        onMarkForReview={onMarkForReview}
        onClear={onClear}
        onPrevious={onPrevious}
        onNext={onNext}
        practice={practice}
        showExplanation={showExplanation}
      />
      <QuestionPalette
        counts={counts}
        questions={questions}
        sections={sections}
        currentIndex={currentIndex}
        currentSectionIndex={currentSectionIndex}
        onSelect={onSelectPalette}
        onSubmit={onSubmit}
        onExit={onExit}
        submitting={submitting}
      />
    </div>
  );
}
