import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Save,
  Clock,
  ChevronRight,
  PhoneOff,
  AlertCircle,
  Flag,
  Lock,
  type AssignmentAttemptBrief,
} from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type {
  QuestionRow,
  QuestionSection,
} from "../hooks/useAssignmentQuestionState";
import { LiveCamera } from "./LiveCamera";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Panel } from "./Panel";

type Counts = {
  answered: number;
  unanswered: number;
  review: number;
  notVisited: number;
  total: number;
};

const PALETTE_COLORS: Record<QuestionRow["status"], string> = {
  answered: "bg-live text-ink-inverse hover:bg-live/88",
  unanswered: "bg-halt text-ink-inverse hover:bg-halt/88",
  review: "bg-hold text-ink-inverse hover:bg-hold/88",
  "not-visited": "bg-room-raised text-ink-muted border border-rule-strong hover:bg-room-sunk",
};

const LEGEND: {
  status: QuestionRow["status"];
  label: string;
  dot: string;
  countKey: keyof Counts;
}[] = [
  { status: "answered", label: "Answered", dot: "bg-live", countKey: "answered" },
  { status: "unanswered", label: "Not answered", dot: "bg-halt", countKey: "unanswered" },
  {
    status: "review",
    label: "Marked for review",
    dot: "bg-hold",
    countKey: "review",
  },
  {
    status: "not-visited",
    label: "Not visited",
    dot: "bg-room-sunk border border-rule-strong",
    countKey: "notVisited",
  },
];

type Props = {
  title: string | null;
  attempt: AssignmentAttemptBrief;
  questions: QuestionRow[];
  sections: QuestionSection[];
  counts: Counts;
  currentIndex: number;
  currentSectionIndex: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  violations: number;
  isFullscreen: boolean;
  cameraStream?: MediaStream | null;
  onAnswer: (optionIndex: number) => void;
  onMarkForReview: () => void;
  onClear: () => void;
  onGoTo: (index: number) => void;
  onGoToSection: (sectionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmitSection: () => void;
  isSectionUnlocked: (sectionIndex: number) => boolean;
  isCurrentSectionLast: boolean;
  isLastSection: boolean;
  onEnterFullscreen: () => void;
  onSubmit: () => void;
  onAutoSubmit: () => void;
  submitting: boolean;
  /** Practice mode: untimed, unproctored, inline explanations. */
  practice: boolean;
};

export function AssignmentTakeView({
  title,
  attempt,
  questions,
  sections,
  counts,
  currentIndex,
  currentSectionIndex,
  saveStatus,
  violations,
  isFullscreen,
  cameraStream,
  onAnswer,
  onMarkForReview,
  onClear,
  onGoTo,
  onGoToSection,
  onNext,
  onPrevious,
  onSubmitSection,
  isSectionUnlocked,
  isCurrentSectionLast,
  isLastSection,
  onEnterFullscreen,
  onSubmit,
  onAutoSubmit,
  submitting,
  practice,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const expiresAt = useMemo(() => Date.parse(attempt.expires_at), [attempt.expires_at]);
  const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!practice && secondsLeft <= 0) onAutoSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, practice]);

  const current = questions[currentIndex];
  const section = sections[currentSectionIndex];

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  // Keyboard answering: A–D / 1–4 to pick, arrows to move.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmOpen || submitting) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const optionCount = questions[currentIndex]?.options.length ?? 0;
      const key = event.key.toLowerCase();
      const letters = ["a", "b", "c", "d", "e", "f"];
      const letterIdx = letters.indexOf(key);
      if (letterIdx >= 0 && letterIdx < optionCount) {
        event.preventDefault();
        onAnswer(letterIdx);
        return;
      }
      if (key >= "1" && key <= "6") {
        const idx = Number(key) - 1;
        if (idx < optionCount) {
          event.preventDefault();
          onAnswer(idx);
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, submitting, currentIndex, questions, onAnswer, onNext, onPrevious]);

  const handlePaletteClick = (index: number) => {
    onGoTo(index);
    if (window.innerWidth < 1024) setPaletteOpen(false);
  };

  return (
    <div className="min-h-screen bg-room">
      <TopBar
        title={title}
        attempt={attempt}
        secondsLeft={secondsLeft}
        violations={violations}
        practice={practice}
        onSubmit={() => setConfirmOpen(true)}
        submitting={submitting}
      />

      {!practice && (
        <ProctorStrip
          violations={violations}
          isFullscreen={isFullscreen}
          onEnterFullscreen={onEnterFullscreen}
        />
      )}

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6">
        {sections.length > 1 && (
          <SectionTabs
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            onSelect={onGoToSection}
            isUnlocked={isSectionUnlocked}
          />
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Question */}
          <div className="min-w-0">
            {current ? (
              <Panel className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="tnum text-base font-semibold text-ink">
                    Question {currentIndex + 1}
                  </h2>
                  <p className="text-xs font-medium text-ink-muted">
                    {section?.name}
                    {current.difficulty && ` · ${current.difficulty}`}
                  </p>
                </div>

                <p className="mt-4 text-[15px] font-medium leading-relaxed text-ink">
                  {current.question}
                </p>

                {current.questionImage && (
                  <img
                    src={absoluteMediaUrl(current.questionImage) ?? current.questionImage}
                    alt="Question figure"
                    className="mt-4 h-52 w-full border border-rule bg-room-sunk object-contain"
                  />
                )}

                <div className="mt-5 space-y-3">
                  {current.options.map((option, oi) => {
                    const checked = current.selected === oi;
                    const image = optionImage(option);
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => onAnswer(oi)}
                        className={cn(
                          "flex w-full items-center gap-3 border px-4 py-3 text-left text-sm transition-colors",
                          checked
                            ? "border-ink bg-ink text-ink-inverse"
                            : "border-rule bg-room-raised text-ink hover:border-rule-strong",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            checked
                              ? "bg-room-raised text-ink"
                              : "border border-rule-strong text-ink-muted",
                          )}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {image && (
                          <img
                            src={absoluteMediaUrl(image) ?? image}
                            alt={optionText(option)}
                            className="h-14 w-20 shrink-0 border border-rule bg-room-raised object-contain"
                          />
                        )}
                        <span className="min-w-0 flex-1">{optionText(option)}</span>
                      </button>
                    );
                  })}
                </div>

                {practice && current.selected !== undefined && current.explanation && (
                  <div className="mt-4 border border-live/25 bg-live-soft p-3 text-xs leading-relaxed text-live">
                    <p className="font-semibold">Explanation</p>
                    <p className="mt-1">{current.explanation}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onMarkForReview}>
                      Mark for review &amp; next
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onClear}>
                      Clear response
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onPrevious}
                      disabled={currentIndex === 0}
                    >
                      Previous
                    </Button>
                    {isCurrentSectionLast ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onSubmitSection}
                        disabled={submitting}
                      >
                        {isLastSection ? "Submit exam" : "Submit section"}
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={onNext}>
                        Save &amp; next
                        <ChevronRight size={14} className="ml-1 inline" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-faint">
                  <span className="flex items-center gap-2">
                    {saveStatus === "saved" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-live">
                        <Check size={11} aria-hidden /> Answer saved
                      </span>
                    )}
                    {saveStatus === "saving" && (
                      <span className="inline-flex items-center gap-1 text-ink-muted">
                        <Save size={11} className="animate-pulse" aria-hidden /> Saving…
                      </span>
                    )}
                    {saveStatus === "error" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-halt">
                        <AlertCircle size={11} aria-hidden /> Offline — retrying
                      </span>
                    )}
                  </span>
                  <span className="tnum">
                    Question {currentIndex + 1} of {questions.length} · {current.marks}{" "}
                    {Number(current.marks) === 1 ? "mark" : "marks"}
                    {current.markedForReview && (
                      <span className="ml-2 font-semibold text-hold">
                        Marked for review
                      </span>
                    )}
                  </span>
                </div>
              </Panel>
            ) : (
              <Panel className="p-10 text-center text-sm text-ink-muted">
                No questions in this section.
              </Panel>
            )}
          </div>

          {/* Palette */}
          <aside className="lg:sticky lg:top-[76px] lg:self-start">
            <button
              type="button"
              onClick={() => setPaletteOpen((v) => !v)}
              aria-expanded={paletteOpen}
              className="flex w-full items-center justify-between border border-rule bg-room-raised px-4 py-3 text-sm font-semibold text-ink lg:hidden"
            >
              <span className="flex items-center gap-2">
                <Flag size={15} className="text-ink-faint" aria-hidden />
                Question palette
                <Badge tone="muted" showIcon={false} className="tnum">
                  {counts.total}
                </Badge>
              </span>
              <ChevronRight
                size={16}
                aria-hidden
                className={cn("text-ink-faint transition-transform", paletteOpen && "rotate-90")}
              />
            </button>

            <div className={cn("mt-3 lg:mt-0 lg:block", paletteOpen ? "block" : "hidden")}>
              <Panel className="p-4">
                <h3 className="text-sm font-semibold text-ink">Question palette</h3>

                <ul className="mt-3 space-y-2 text-[11px] text-ink-muted">
                  {LEGEND.map((item) => (
                    <li key={item.status} className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 shrink-0", item.dot)} />
                      <span>{item.label}</span>
                      <span className="tnum ml-auto font-semibold text-ink-muted">
                        ({counts[item.countKey]})
                      </span>
                    </li>
                  ))}
                </ul>

                {sections.length > 1 && (
                  <>
                    <p className="mt-4 break-words text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      {section?.name}
                    </p>
                    <p className="tnum mt-1 text-[11px] text-ink-faint">
                      Q{(section?.startIndex ?? 0) + 1}–{(section?.endIndex ?? 0) + 1}
                    </p>
                  </>
                )}

                <div className="mt-2 grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const isCurrent = i === currentIndex;
                    const unlocked = isSectionUnlocked(
                      sections.findIndex(
                        (s) => i >= s.startIndex && i <= s.endIndex,
                      ),
                    );
                    return (
                      <button
                        key={`${q.stepId}-${q.questionId}`}
                        type="button"
                        onClick={() => handlePaletteClick(i)}
                        disabled={!unlocked}
                        title={
                          unlocked
                            ? `Question ${i + 1} — ${q.status.replace("-", " ")}`
                            : "Submit the previous section to unlock"
                        }
                        aria-label={`Question ${i + 1}: ${q.status.replace("-", " ")}`}
                        aria-current={isCurrent}
                        className={cn(
                          "tnum inline-flex h-9 w-9 items-center justify-center text-xs font-semibold transition-colors",
                          unlocked ? PALETTE_COLORS[q.status] : "cursor-not-allowed bg-room-sunk text-ink-faint",
                          isCurrent && "ring-2 ring-ink ring-offset-1",
                        )}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  block
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                  className="mt-5"
                >
                  Submit test
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="mt-2 w-full text-center text-[11px] text-ink-faint transition-colors hover:text-ink-muted"
                >
                  Exit without submitting
                </button>
              </Panel>
            </div>
          </aside>
        </div>
      </div>

      {!practice && secondsLeft <= 300 && !submitting && (
        <div role="status" className="tnum fixed bottom-4 left-1/2 z-40 -translate-x-1/2 border border-halt bg-halt px-4 py-2 text-xs font-semibold text-ink-inverse shadow-lg">
          {formatCountdown(secondsLeft)} left — submitting automatically
        </div>
      )}

      {confirmOpen && (
        <SubmitConfirmModal
          counts={counts}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={onSubmit}
          submitting={submitting}
        />
      )}

      {cameraStream && <LiveCamera stream={cameraStream} />}
    </div>
  );
}

function TopBar({
  title,
  attempt,
  secondsLeft,
  violations,
  practice,
  onSubmit,
  submitting,
}: {
  title: string | null;
  attempt: AssignmentAttemptBrief;
  secondsLeft: number;
  violations: number;
  practice: boolean;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-room-raised/95 px-3 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-ink">{title ?? "Assignment"}</h1>
          <p className="text-[11px] text-ink-muted">
            {attempt.model_name} · {attempt.model_code}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {violations > 0 && (
            <span className="tnum hidden items-center gap-1 text-xs font-semibold text-hold sm:inline-flex">
              <PhoneOff size={13} aria-hidden /> {violations} violation{violations === 1 ? "" : "s"}
            </span>
          )}
          {practice ? (
            <Badge tone="live" showIcon={false} className="px-3 py-1.5 text-xs">
              <Clock size={13} aria-hidden /> Untimed practice
            </Badge>
          ) : (
            <span
              className={cn(
                "tnum inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-semibold",
                secondsLeft < 60
                  ? "animate-pulse border-halt/25 bg-halt-soft text-halt"
                  : "border-rule bg-room-sunk text-ink",
              )}
            >
              <Clock size={14} aria-hidden /> {formatCountdown(secondsLeft)}
            </span>
          )}
          <Button variant="primary" size="sm" onClick={onSubmit} disabled={submitting}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProctorStrip({
  violations,
  isFullscreen,
  onEnterFullscreen,
}: {
  violations: number;
  isFullscreen: boolean;
  onEnterFullscreen: () => void;
}) {
  return (
    <div
      className={cn(
        "border-b px-3 py-2 text-[11px] sm:px-6",
        isFullscreen
          ? "border-live/25 bg-live-soft text-live"
          : "border-hold/30 bg-hold-soft text-hold",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AlertTriangle size={13} aria-hidden />
          {isFullscreen ? (
            <>
              Fullscreen on. Tab switches, copying and camera disconnects are recorded
              {violations > 0 && ` — ${violations} so far`}.
            </>
          ) : (
            <>This exam is monitored — stay in fullscreen. Shortcuts and right-click are disabled.</>
          )}
        </span>
        {!isFullscreen && (
          <Button variant="primary" size="sm" onClick={onEnterFullscreen}>
            Enter fullscreen
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionTabs({
  sections,
  currentSectionIndex,
  onSelect,
  isUnlocked,
}: {
  sections: QuestionSection[];
  currentSectionIndex: number;
  onSelect: (sectionIndex: number) => void;
  isUnlocked: (sectionIndex: number) => boolean;
}) {
  return (
    <div className="overflow-x-auto border-b border-rule">
      <div className="flex min-w-fit gap-6" role="tablist" aria-label="Exam sections">
        {sections.map((section, i) => {
          const active = i === currentSectionIndex;
          const unlocked = isUnlocked(i);
          return (
            <button
              key={`${section.stepId}-${i}`}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!unlocked}
              onClick={() => onSelect(i)}
              title={unlocked ? undefined : "Submit the previous section to unlock"}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold whitespace-nowrap transition-colors",
                active
                  ? "border-ink text-ink"
                  : unlocked
                    ? "border-transparent text-ink-muted hover:text-ink"
                    : "cursor-not-allowed border-transparent text-ink-faint",
              )}
            >
              {!unlocked && <Lock size={12} className="shrink-0" aria-hidden />}
              {section.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}