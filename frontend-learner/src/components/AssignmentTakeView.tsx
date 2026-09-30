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

type Counts = {
  answered: number;
  unanswered: number;
  review: number;
  notVisited: number;
  total: number;
};

const PALETTE_COLORS: Record<QuestionRow["status"], string> = {
  answered: "bg-emerald-500 text-white hover:bg-emerald-600",
  unanswered: "bg-red-500 text-white hover:bg-red-600",
  review: "bg-orange-500 text-white hover:bg-orange-600",
  "not-visited": "bg-white text-zinc-600 border border-zinc-300 hover:bg-zinc-50",
};

const LEGEND: {
  status: QuestionRow["status"];
  label: string;
  dot: string;
  countKey: keyof Counts;
}[] = [
  { status: "answered", label: "Answered", dot: "bg-emerald-500", countKey: "answered" },
  { status: "unanswered", label: "Not answered", dot: "bg-red-500", countKey: "unanswered" },
  {
    status: "review",
    label: "Marked for review",
    dot: "bg-orange-500",
    countKey: "review",
  },
  {
    status: "not-visited",
    label: "Not visited",
    dot: "bg-zinc-200 border border-zinc-300",
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
    <div className="min-h-screen bg-[#f4f6fb]">
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
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-zinc-900">
                    Question {currentIndex + 1}
                  </h2>
                  <p className="text-xs font-medium text-zinc-500">
                    {section?.name}
                    {current.difficulty && ` · ${current.difficulty}`}
                  </p>
                </div>

                <p className="mt-4 text-[15px] font-medium leading-relaxed text-zinc-900">
                  {current.question}
                </p>

                {current.questionImage && (
                  <img
                    src={absoluteMediaUrl(current.questionImage) ?? current.questionImage}
                    alt="Question figure"
                    className="mt-4 h-52 w-full rounded-xl border border-zinc-200 object-contain"
                  />
                )}

                <div className="mt-5 space-y-2.5">
                  {current.options.map((option, oi) => {
                    const checked = current.selected === oi;
                    const image = optionImage(option);
                    return (
                      <button
                        key={oi}
                        onClick={() => onAnswer(oi)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                          checked
                            ? "border-[#0f172a] bg-[#0f172a] text-white"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            checked
                              ? "bg-white text-[#0f172a]"
                              : "border border-zinc-300 text-zinc-600",
                          )}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {image && (
                          <img
                            src={absoluteMediaUrl(image) ?? image}
                            alt={optionText(option)}
                            className="h-14 w-20 shrink-0 rounded-md border border-zinc-200 bg-white object-contain"
                          />
                        )}
                        <span className="min-w-0 flex-1">{optionText(option)}</span>
                      </button>
                    );
                  })}
                </div>

                {practice && current.selected !== undefined && current.explanation && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                    <p className="font-bold">Explanation</p>
                    <p className="mt-0.5">{current.explanation}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={onMarkForReview}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Mark for review &amp; next
                    </button>
                    <button
                      onClick={onClear}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Clear response
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onPrevious}
                      disabled={currentIndex === 0}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-400 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {isCurrentSectionLast ? (
                      <button
                        onClick={onSubmitSection}
                        disabled={submitting}
                        className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isLastSection ? "Submit exam" : "Submit section"}
                      </button>
                    ) : (
                      <button
                        onClick={onNext}
                        className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
                        Save &amp; next
                        <ChevronRight size={14} className="ml-1 inline" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-2">
                    {saveStatus === "saved" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <Check size={11} /> Answer saved
                      </span>
                    )}
                    {saveStatus === "saving" && (
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        <Save size={11} className="animate-pulse" /> Saving…
                      </span>
                    )}
                    {saveStatus === "error" && (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-500">
                        <AlertCircle size={11} /> Offline — retrying
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    Question {currentIndex + 1} of {questions.length} · {current.marks}{" "}
                    {Number(current.marks) === 1 ? "mark" : "marks"}
                    {current.markedForReview && (
                      <span className="ml-2 font-semibold text-orange-600">
                        Marked for review
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                No questions in this section.
              </div>
            )}
          </div>

          {/* Palette */}
          <aside className="lg:sticky lg:top-[76px] lg:self-start">
            <button
              onClick={() => setPaletteOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm lg:hidden"
            >
              <span className="flex items-center gap-2">
                <Flag size={15} className="text-zinc-400" />
                Question palette
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                  {counts.total}
                </span>
              </span>
              <ChevronRight
                size={16}
                className={cn("text-zinc-400 transition-transform", paletteOpen && "rotate-90")}
              />
            </button>

            <div className={cn("mt-3 lg:mt-0 lg:block", paletteOpen ? "block" : "hidden")}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900">Question palette</h3>

                <ul className="mt-3 space-y-1.5 text-[11px] text-zinc-600">
                  {LEGEND.map((item) => (
                    <li key={item.status} className="flex items-center gap-2">
                      <span className={cn("h-3 w-3 shrink-0 rounded-sm", item.dot)} />
                      <span>{item.label}</span>
                      <span className="ml-auto font-semibold tabular-nums text-zinc-500">
                        ({counts[item.countKey]})
                      </span>
                    </li>
                  ))}
                </ul>

                {sections.length > 1 && (
                  <>
                    <p className="mt-4 break-words text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                      {section?.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      Q{(section?.startIndex ?? 0) + 1}–{(section?.endIndex ?? 0) + 1}
                    </p>
                  </>
                )}

                <div className="mt-2 grid grid-cols-5 gap-1.5">
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
                          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition",
                          unlocked ? PALETTE_COLORS[q.status] : "cursor-not-allowed bg-zinc-100 text-zinc-400",
                          isCurrent && "ring-2 ring-[#0f172a] ring-offset-1",
                        )}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                  className="mt-5 w-full rounded-lg bg-[#2563eb] py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Submit test
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="mt-2 w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600"
                >
                  Exit without submitting
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {!practice && secondsLeft <= 300 && !submitting && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
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
    <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-zinc-900">{title ?? "Assignment"}</h1>
          <p className="text-[11px] text-zinc-500">
            {attempt.model_name} · {attempt.model_code}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {violations > 0 && (
            <span className="hidden items-center gap-1 text-xs font-semibold text-amber-600 sm:inline-flex">
              <PhoneOff size={13} /> {violations} violation{violations === 1 ? "" : "s"}
            </span>
          )}
          {practice ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <Clock size={13} /> Untimed practice
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums",
                secondsLeft < 60
                  ? "animate-pulse bg-red-100 text-red-700"
                  : "bg-zinc-100 text-zinc-900",
              )}
            >
              <Clock size={14} /> {formatCountdown(secondsLeft)}
            </span>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Submit
          </button>
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
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <AlertTriangle size={13} />
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
          <button
            onClick={onEnterFullscreen}
            className="rounded-md bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-700"
          >
            Enter fullscreen
          </button>
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
    <div className="overflow-x-auto border-b border-zinc-200">
      <div className="flex min-w-fit gap-6" role="tablist" aria-label="Exam sections">
        {sections.map((section, i) => {
          const active = i === currentSectionIndex;
          const unlocked = isUnlocked(i);
          return (
            <button
              key={`${section.stepId}-${i}`}
              role="tab"
              aria-selected={active}
              disabled={!unlocked}
              onClick={() => onSelect(i)}
              title={unlocked ? undefined : "Submit the previous section to unlock"}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap transition",
                active
                  ? "border-[#2563eb] text-[#2563eb]"
                  : unlocked
                    ? "border-transparent text-zinc-600 hover:text-zinc-900"
                    : "cursor-not-allowed border-transparent text-zinc-300",
              )}
            >
              {!unlocked && <Lock size={12} className="shrink-0" />}
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