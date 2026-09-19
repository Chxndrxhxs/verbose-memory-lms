import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Save,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eraser,
  PhoneOff,
  AlertCircle,
  Flag,
  Lock,
  type AssignmentAttemptBrief,
} from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import type { QuestionRow } from "../hooks/useAssignmentQuestionState";
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

type Props = {
  title: string | null;
  attempt: AssignmentAttemptBrief;
  questions: QuestionRow[];
  counts: Counts;
  currentIndex: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  violations: number;
  isFullscreen: boolean;
  cameraStream?: MediaStream | null;
  onAnswer: (optionIndex: number) => void;
  onMarkForReview: () => void;
  onClear: () => void;
  onGoTo: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onEnterFullscreen: () => void;
  onSubmit: () => void;
  onAutoSubmit: () => void;
  submitting: boolean;
};

export function AssignmentTakeView({
  title,
  attempt,
  questions,
  counts,
  currentIndex,
  saveStatus,
  violations,
  isFullscreen,
  cameraStream,
  onAnswer,
  onMarkForReview,
  onClear,
  onGoTo,
  onNext,
  onPrevious,
  onEnterFullscreen,
  onSubmit,
  onAutoSubmit,
  submitting,
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
    if (secondsLeft <= 0) onAutoSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const current = questions[currentIndex];

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  const handlePaletteClick = (index: number) => {
    onGoTo(index);
    if (window.innerWidth < 1024) setPaletteOpen(false);
  };

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
        onSubmit={() => setConfirmOpen(true)}
        submitting={submitting}
      />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        {/* Mobile palette toggle */}
        <button
          onClick={() => setPaletteOpen((v) => !v)}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition lg:hidden"
        >
          <span className="flex items-center gap-2">
            <Flag size={16} className="text-zinc-400" />
            Question Palette
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              {counts.total}
            </span>
          </span>
          <ChevronDownIcon open={paletteOpen} />
        </button>

        {paletteOpen && (
          <div className="mb-4 lg:hidden">
            <QuestionPalette
              questions={questions}
              currentIndex={currentIndex}
              onSelect={handlePaletteClick}
            />
          </div>
        )}

        {secondsLeft <= 300 && !submitting && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <Clock size={14} />
            Time is almost up! {formatCountdown(secondsLeft)} remaining — your assignment will be
            submitted automatically.
          </div>
        )}

        {!isFullscreen && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-900 px-4 py-2.5 text-[11px] font-semibold text-white">
            <Lock size={13} />
            Lockdown mode: keyboard shortcuts, Esc, right-click and browser inspect tools are disabled
            during the exam.
          </div>
        )}

        {!isFullscreen && (
          <ProctorBanner
            violations={violations}
            isFullscreen={isFullscreen}
            onEnterFullscreen={onEnterFullscreen}
          />
        )}

        <div className="mt-2 flex flex-col gap-6 lg:flex-row">
          {/* Question area */}
          <div className="min-w-0 flex-1 space-y-4">
            {current && (
              <div className="rounded-[22px] border bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-relaxed sm:text-[15px]">
                    <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {current.index + 1}
                    </span>
                    {current.question}
                  </p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
                      {current.marks} {Number(current.marks) === 1 ? "mark" : "marks"}
                    </span>
                    {current.markedForReview && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                        Marked for review
                      </span>
                    )}
                  </div>
                </div>
                {current.questionImage && (
                  <img
                    src={absoluteMediaUrl(current.questionImage) ?? current.questionImage}
                    alt="Question figure"
                    className="mt-3 h-44 w-full rounded-xl border border-zinc-200 object-contain"
                  />
                )}
                {current.topic && (
                  <p className="ml-8 mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    {current.topic} · {current.difficulty}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  {current.options.map((option, oi) => {
                    const checked = current.selected === oi;
                    const image = optionImage(option);
                    return (
                      <button
                        key={oi}
                        onClick={() => onAnswer(oi)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                          checked
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            checked ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {image && (
                          <img
                            src={absoluteMediaUrl(image) ?? image}
                            alt={optionText(option)}
                            className="h-12 w-16 shrink-0 rounded-md border border-zinc-200 object-cover"
                          />
                        )}
                        <span className="min-w-0">{optionText(option)}</span>
                        {checked && <Check size={16} className="ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {current.selected !== undefined && (
                  <p className="mt-3 text-[11px] font-semibold text-emerald-600">
                    Selected option {String.fromCharCode(65 + current.selected)}
                  </p>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onClear}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <Eraser size={14} /> Clear Answer
                </button>
                <button
                  onClick={onMarkForReview}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
                >
                  <Flag size={14} /> Mark for Review
                </button>
                <button
                  onClick={onNext}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Save &amp; Next <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
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
            <div className={`sticky ${isFullscreen ? "top-[80px]" : "top-[150px]"}`}>
              <QuestionPalette
                questions={questions}
                currentIndex={currentIndex}
                onSelect={handlePaletteClick}
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
  onSubmit,
  submitting,
}: {
  title: string | null;
  attempt: AssignmentAttemptBrief;
  secondsLeft: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  violations: number;
  isFullscreen: boolean;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className={`sticky z-20 border-b border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6 ${
        isFullscreen ? "top-0" : "top-[53px]"
      }`}
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
            <span className="hidden items-center gap-1 text-xs font-semibold text-red-500 sm:inline-flex">
              <AlertCircle size={12} /> Offline — retrying
            </span>
          )}
          {violations > 0 && (
            <span className="hidden items-center gap-1 text-xs font-semibold text-amber-600 sm:inline-flex">
              <PhoneOff size={12} /> {violations} violation{violations === 1 ? "" : "s"}
            </span>
          )}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${
              secondsLeft < 60
                ? "animate-pulse bg-red-100 text-red-700"
                : "bg-zinc-900 text-white"
            }`}
          >
            <Clock size={14} /> {formatCountdown(secondsLeft)}
          </div>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
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
      className={`mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
        isFullscreen
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={14} />
        {isFullscreen ? (
          <>
            Fullscreen is active. This exam is monitored with your camera ON — switching tabs,
            copying content, or disconnecting the camera is recorded and may auto-submit your
            attempt.
          </>
        ) : (
          <>
            This exam is monitored with your camera ON. You must stay in fullscreen — leaving it,
            switching tabs, copying content, or disconnecting the camera is recorded and may
            auto-submit your attempt.
          </>
        )}
        {violations > 0 && (
          <strong className={isFullscreen ? "text-emerald-700" : "text-amber-700"}>
            {violations} {violations === 1 ? "violation" : "violations"} recorded.
          </strong>
        )}
      </span>
      {!isFullscreen && (
        <button
          onClick={onEnterFullscreen}
          className="rounded-full bg-amber-600 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-700"
        >
          Enter fullscreen
        </button>
      )}
    </div>
  );
}

function QuestionPalette({
  questions,
  currentIndex,
  onSelect,
}: {
  questions: QuestionRow[];
  currentIndex: number;
  onSelect: (index: number) => void;
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

  return (
    <div className="rounded-[22px] border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Question Palette
      </p>

      <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const classes = PALETTE_COLORS[q.status];
          return (
            <button
              key={`${q.stepId}-${q.questionId}`}
              onClick={() => onSelect(i)}
              title={`Question ${i + 1} — ${q.status.replace("-", " ")}`}
              aria-label={`Question ${i + 1}: ${q.status.replace("-", " ")}`}
              className={`inline-flex h-8 w-8 items-center justify-center rounded text-[11px] font-bold transition ${
                isCurrent
                  ? "ring-2 ring-zinc-900 ring-offset-2 border-zinc-900 text-zinc-900"
                  : ""
              } ${classes}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3 text-[11px]">
        <LegendRow color="bg-emerald-500" label="Answered" value={counts.answered} />
        <LegendRow color="bg-red-500" label="Unanswered" value={counts.unanswered} />
        <LegendRow color="bg-orange-500" label="Review Later" value={counts.review} />
        <LegendRow color="bg-zinc-800" label="Not Visited" value={counts.notVisited} />
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
      <span className={`h-3 w-3 rounded ${color}`} />
      <span>{label}</span>
      <span className="ml-auto font-bold tabular-nums">{value}</span>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 border-b-2 border-r-2 border-zinc-500 transition-transform ${
        open ? "-translate-y-0.5 rotate-45" : "translate-y-0.5 rotate-[225deg]"
      }`}
    />
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