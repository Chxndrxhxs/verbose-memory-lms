import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Save,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eraser,
  PhoneOff,
  AlertCircle,
  Flag,
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
import { TopNav } from "./TopNav";

type Counts = {
  answered: number;
  unanswered: number;
  review: number;
  notVisited: number;
  total: number;
};

const chip = "rounded-full px-2 py-0.5 text-[11px]";

const navBtn = cn(
  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5",
  "text-sm font-semibold transition",
);

const actionBtn = cn(
  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5",
  "text-sm font-semibold transition",
);

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

  const answeredPct =
    counts.total > 0 ? Math.round((counts.answered / counts.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      {!isFullscreen && <TopNav />}
      <TopBar
        title={title}
        attempt={attempt}
        secondsLeft={secondsLeft}
        saveStatus={saveStatus}
        violations={violations}
        isFullscreen={isFullscreen}
        practice={practice}
        onSubmit={() => setConfirmOpen(true)}
        submitting={submitting}
      />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${answeredPct}%` }}
            />
          </div>
          <p className="shrink-0 text-xs font-semibold text-zinc-500 tabular-nums">
            {counts.answered} of {counts.total} answered
          </p>
        </div>

        {/* Mobile palette toggle */}
        <button
          onClick={() => setPaletteOpen((v) => !v)}
          className={cn(
            "mb-4 flex w-full items-center justify-between rounded-xl border",
            "border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700",
            "transition lg:hidden",
          )}
        >
          <span className="flex items-center gap-2">
            <Flag size={16} className="text-zinc-400" />
            Question Palette
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              {counts.total}
            </span>
          </span>
          <ChevronDown
            size={15}
            className={cn("text-zinc-400 transition-transform", paletteOpen && "rotate-180")}
          />
        </button>

        {paletteOpen && (
          <div className="mb-4 lg:hidden">
            <QuestionPalette
              questions={questions}
              sections={sections}
              currentIndex={currentIndex}
              currentSectionIndex={currentSectionIndex}
              onSelect={handlePaletteClick}
              onSelectSection={onGoToSection}
            />
          </div>
        )}

        {!practice && secondsLeft <= 300 && !submitting && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 rounded-2xl border border-red-200",
              "bg-red-50 px-4 py-3 text-xs font-semibold text-red-700",
            )}
          >
            <Clock size={14} />
            Time is almost up! {formatCountdown(secondsLeft)} remaining — your
            assignment will be submitted automatically.
          </div>
        )}

        {!practice && (
          <ProctorBanner
            violations={violations}
            isFullscreen={isFullscreen}
            onEnterFullscreen={onEnterFullscreen}
          />
        )}

        <div className="mt-4 flex flex-col gap-6 lg:flex-row">
          {/* Question area */}
          <div className="min-w-0 flex-1 space-y-4">
            {sections.length > 1 && (
              <SectionTabs
                sections={sections}
                questions={questions}
                currentSectionIndex={currentSectionIndex}
                onSelect={onGoToSection}
              />
            )}
            {current && (
              <div className="rounded-[22px] border bg-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "bg-zinc-900 text-xs font-bold text-white",
                    )}
                  >
                    {current.index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed font-medium sm:text-[15px]">
                      {current.question}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={cn(chip, "bg-zinc-100 font-semibold text-zinc-500")}>
                        {current.marks}{" "}
                        {Number(current.marks) === 1 ? "mark" : "marks"}
                      </span>
                      {current.topic && (
                        <span className={cn(chip, "bg-sky-100 font-bold text-sky-700")}>
                          {current.topic}
                        </span>
                      )}
                      {current.markedForReview && (
                        <span
                          className={cn(chip, "bg-orange-100 font-semibold text-orange-600")}
                        >
                          Marked for review
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {current.questionImage && (
                  <img
                    src={absoluteMediaUrl(current.questionImage) ?? current.questionImage}
                    alt="Question figure"
                    className="mt-3 h-44 w-full rounded-xl border border-zinc-200 object-contain"
                  />
                )}
                <div className="mt-4 space-y-2">
                  {current.options.map((option, oi) => {
                    const checked = current.selected === oi;
                    const image = optionImage(option);
                    return (
                      <button
                        key={oi}
                        onClick={() => onAnswer(oi)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border",
                          "px-3.5 py-2.5 text-left text-sm transition",
                          checked
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 shrink-0 items-center justify-center",
                            "rounded-full text-[11px] font-bold",
                            checked
                              ? "bg-white text-zinc-900"
                              : "bg-zinc-100 text-zinc-500",
                          )}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {image && (
                          <img
                            src={absoluteMediaUrl(image) ?? image}
                            alt={optionText(option)}
                            className={cn(
                              "h-16 w-24 shrink-0 rounded-md border border-zinc-200",
                              "bg-white object-contain",
                            )}
                          />
                        )}
                        <span className="min-w-0">{optionText(option)}</span>
                        {checked && <Check size={16} className="ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {practice && current.selected !== undefined && current.explanation && (
                  <div
                    className={cn(
                      "mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed",
                      "text-emerald-900",
                    )}
                  >
                    <p className="font-bold">Explanation</p>
                    <p className="mt-0.5">{current.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3",
                "rounded-2xl border bg-white p-4",
              )}
            >
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className={cn(
                  navBtn,
                  "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onClear}
                  className={cn(
                    actionBtn,
                    "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
                  )}
                >
                  <Eraser size={14} /> Clear
                </button>
                <button
                  onClick={onMarkForReview}
                  className={cn(
                    actionBtn,
                    "border border-orange-200 bg-orange-50 text-orange-600",
                    "hover:bg-orange-100",
                  )}
                >
                  <Flag size={14} /> Review later
                </button>
                <button
                  onClick={onNext}
                  className={cn(
                    actionBtn,
                    "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50",
                  )}
                >
                  Save &amp; Next <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
                <span className="hidden sm:inline"> · press A–D to answer, ← → to move</span>
              </span>
              <span className="flex items-center gap-3">
                {violations > 0 && (
                  <span className="font-semibold text-amber-600">
                    {violations} {violations === 1 ? "violation" : "violations"}
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <Check size={12} /> Answer saved
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 text-zinc-500">
                    <Save size={12} className="animate-pulse" /> Saving…
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Palette sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
            <div className={cn("sticky", isFullscreen ? "top-[80px]" : "top-[150px]")}>
              <QuestionPalette
                questions={questions}
                sections={sections}
                currentIndex={currentIndex}
                currentSectionIndex={currentSectionIndex}
                onSelect={handlePaletteClick}
                onSelectSection={onGoToSection}
              />
            </div>
          </aside>
        </div>
      </div>

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
  saveStatus,
  violations,
  isFullscreen,
  practice,
  onSubmit,
  submitting,
}: {
  title: string | null;
  attempt: AssignmentAttemptBrief;
  secondsLeft: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  violations: number;
  isFullscreen: boolean;
  practice: boolean;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className={cn(
        "sticky z-20 border-b border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6",
        isFullscreen ? "top-0" : "top-[53px]",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title ?? "Assignment"}</p>
          <p className="text-xs text-zinc-500">
            {attempt.model_name} · {attempt.model_code}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "error" && (
            <span
              className={cn(
                "hidden items-center gap-1 text-xs font-semibold text-red-500",
                "sm:inline-flex",
              )}
            >
              <AlertCircle size={12} /> Offline — retrying
            </span>
          )}
          {violations > 0 && (
            <span
              className={cn(
                "hidden items-center gap-1 text-xs font-semibold text-amber-600",
                "sm:inline-flex",
              )}
            >
              <PhoneOff size={12} /> {violations} violation{violations === 1 ? "" : "s"}
            </span>
          )}
          {practice ? (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-emerald-100",
                "px-3 py-1.5 text-sm font-bold text-emerald-800",
              )}
            >
              <Clock size={14} /> Untimed practice
            </div>
          ) : (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "text-sm font-bold tabular-nums",
                secondsLeft < 60
                  ? "animate-pulse bg-red-100 text-red-700"
                  : "bg-zinc-900 text-white",
              )}
            >
              <Clock size={14} /> {formatCountdown(secondsLeft)}
            </div>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-emerald-600",
              "px-4 py-2 text-sm font-semibold text-white transition",
              "hover:bg-emerald-700 disabled:opacity-60",
            )}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ProctorBanner({
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
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        "rounded-2xl border px-4 py-3 text-xs",
        isFullscreen
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={14} />
        {isFullscreen ? (
          <>
            Fullscreen is on. Tab switches, copying, and camera disconnects are
            recorded{violations > 0 && ` — ${violations} recorded so far`} and may
            auto-submit your attempt.
          </>
        ) : (
          <>
            This exam is monitored — stay in fullscreen. Shortcuts, right-click and
            inspect tools are disabled while you take it.
          </>
        )}
      </span>
      {!isFullscreen && (
        <button
          onClick={onEnterFullscreen}
          className={cn(
            "rounded-full bg-amber-600 px-3 py-1.5 font-semibold text-white",
            "transition hover:bg-amber-700",
          )}
        >
          Enter fullscreen
        </button>
      )}
    </div>
  );
}

function SectionTabs({
  sections,
  questions,
  currentSectionIndex,
  onSelect,
}: {
  sections: QuestionSection[];
  questions: QuestionRow[];
  currentSectionIndex: number;
  onSelect: (sectionIndex: number) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2"
      role="tablist"
      aria-label="Exam sections"
    >
      {sections.map((section, i) => {
        const rows = questions.slice(section.startIndex, section.endIndex + 1);
        const answered = rows.filter((q) => q.status === "answered").length;
        const active = i === currentSectionIndex;
        return (
          <button
            key={`${section.stepId}-${i}`}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className={cn(
              "min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition",
              active
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
            )}
          >
            <span className="block truncate text-xs font-bold">
              {section.name}
            </span>
            <span
              className={cn(
                "mt-0.5 block text-[11px] tabular-nums",
                active ? "text-white/70" : "text-zinc-400",
              )}
            >
              {answered}/{rows.length} done · Q{section.startIndex + 1}–
              {section.endIndex + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuestionPalette({
  questions,
  sections,
  currentIndex,
  currentSectionIndex,
  onSelect,
  onSelectSection,
}: {
  questions: QuestionRow[];
  sections: QuestionSection[];
  currentIndex: number;
  currentSectionIndex: number;
  onSelect: (index: number) => void;
  onSelectSection: (sectionIndex: number) => void;
}) {
  const counts = useMemo(
    () => ({
      answered: questions.filter((q) => q.status === "answered").length,
      unanswered: questions.filter((q) => q.status === "unanswered").length,
      review: questions.filter((q) => q.status === "review").length,
      notVisited: questions.filter((q) => q.status === "not-visited").length,
    }),
    [questions],
  );
  const grouped = sections.length > 1;

  return (
    <div className="rounded-[22px] border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Question Palette
      </p>

      {grouped ? (
        <div className="mt-3 space-y-4">
          {sections.map((section, si) => (
            <div key={`${section.stepId}-${si}`}>
              <button
                onClick={() => onSelectSection(si)}
                className={cn(
                  "mb-1.5 flex w-full items-center justify-between text-[11px] font-bold",
                  si === currentSectionIndex ? "text-zinc-900" : "text-zinc-500",
                )}
              >
                <span className="truncate">{section.name}</span>
                <span className="ml-2 shrink-0 tabular-nums text-zinc-400">
                  Q{section.startIndex + 1}–{section.endIndex + 1}
                </span>
              </button>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
                {questions
                  .slice(section.startIndex, section.endIndex + 1)
                  .map((q) => {
                    const i = q.index;
                    const isCurrent = i === currentIndex;
                    return (
                      <button
                        key={`${q.stepId}-${q.questionId}`}
                        onClick={() => onSelect(i)}
                        title={`Question ${i + 1} — ${q.status.replace("-", " ")}`}
                        aria-label={`Question ${i + 1}: ${q.status.replace("-", " ")}`}
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                          "text-xs font-bold transition",
                          PALETTE_COLORS[q.status],
                          isCurrent && "ring-2 ring-zinc-900 ring-offset-2",
                        )}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
          {questions.map((q, i) => {
            const isCurrent = i === currentIndex;
            return (
              <button
                key={`${q.stepId}-${q.questionId}`}
                onClick={() => onSelect(i)}
                title={`Question ${i + 1} — ${q.status.replace("-", " ")}`}
                aria-label={`Question ${i + 1}: ${q.status.replace("-", " ")}`}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  "text-xs font-bold transition",
                  PALETTE_COLORS[q.status],
                  isCurrent && "ring-2 ring-zinc-900 ring-offset-2",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3 text-[11px]">
        <LegendRow color="bg-emerald-500" label="Answered" value={counts.answered} />
        <LegendRow color="bg-red-500" label="Unanswered" value={counts.unanswered} />
        <LegendRow color="bg-orange-500" label="Review later" value={counts.review} />
        <LegendRow color="bg-zinc-300" label="Not visited" value={counts.notVisited} />
      </div>
    </div>
  );
}

const PALETTE_COLORS: Record<QuestionRow["status"], string> = {
  answered: "bg-emerald-500 text-white hover:bg-emerald-600",
  unanswered: "bg-red-500 text-white hover:bg-red-600",
  review: "bg-orange-500 text-white hover:bg-orange-600",
  "not-visited": "bg-zinc-200 text-zinc-500 hover:bg-zinc-300",
};

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-zinc-600">
      <span className={cn("h-3 w-3 rounded", color)} />
      <span>{label}</span>
      <span className="ml-auto font-bold tabular-nums">{value}</span>
    </div>
  );
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
