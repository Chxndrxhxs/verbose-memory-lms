import { useMemo, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  Copy,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Search,
  Upload,
  X,
} from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { uploadFile } from "../lib/api";
import { builderCardClass } from "../lib/builder";
import type { Assignment, AssignmentQuestion, QuestionDifficulty } from "../types/assignment";
import {
  createEmptyQuestion,
  DIFFICULTY_LABELS,
  needsReviewQuestions,
  questionFlags,
  topicBreakdown,
} from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

const filterInput =
  "h-12 rounded-sm border border-rule bg-slate-panel px-4 text-sm text-ink focus:border-ink";

const iconBtn = cn(
  "flex h-10 w-10 items-center justify-center rounded-sm",
  "text-ink-faint hover:bg-slate-sunk hover:text-ink",
);

const badgePill = "shrink-0 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]";

const editArea = cn(
  "w-full resize-none rounded-sm border border-rule bg-slate-panel",
  "px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-ink",
);

const ghostPill = cn(
  "inline-flex h-11 items-center gap-2 rounded-sm border border-rule",
  "px-4 text-sm font-semibold text-ink-muted hover:bg-slate-sunk",
);

const darkPill = cn(
  "inline-flex h-11 items-center gap-2 rounded-sm bg-ink",
  "px-5 text-sm font-semibold text-ink-inverse hover:opacity-90",
);

function QuestionCard({
  question,
  index,
  total,
  expanded,
  selected,
  onToggleExpand,
  onToggleSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: AssignmentQuestion;
  index: number;
  total: number;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onUpdate: (patch: Partial<AssignmentQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [uploadingFigure, setUploadingFigure] = useState(false);
  const [figureError, setFigureError] = useState<string | null>(null);
  const figureInputRef = useRef<HTMLInputElement>(null);
  const flags = questionFlags(question);

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...question.options];
    const prev = question.options[idx];
    newOptions[idx] =
      typeof prev === "object" && prev.image
        ? { text: value, image: prev.image }
        : value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    if (question.options.length < 6) {
      onUpdate({ options: [...question.options, ""] });
    }
  };

  const removeOption = (idx: number) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== idx);
      const newCorrect =
        question.correctAnswer >= newOptions.length
          ? 0
          : question.correctAnswer > idx
            ? question.correctAnswer - 1
            : question.correctAnswer;
      onUpdate({ options: newOptions, correctAnswer: newCorrect });
    }
  };

  const letterFor = (i: number) => String.fromCharCode(65 + i);

  const handleFigureFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFigureError(null);
    if (!file.type.startsWith("image/")) {
      setFigureError("Only image files can be attached as figures.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFigureError("Image too large. Maximum size is 5MB.");
      return;
    }
    setUploadingFigure(true);
    try {
      const { url } = await uploadFile(file);
      onUpdate({ questionImage: url });
    } catch {
      setFigureError("Figure upload failed. Please try again.");
    } finally {
      setUploadingFigure(false);
    }
  };

  return (
    <div
      className={cn(
        "border bg-slate-panel",
        flags.length > 0 ? "border-hold/40" : "border-rule",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-rule px-4 py-3",
          "sm:gap-4 sm:px-5 sm:py-4",
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          title="Select for bulk actions"
          className="h-4 w-4 shrink-0 accent-ink"
        />
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full tnum",
            "bg-ink text-[10px] font-semibold text-ink-inverse",
          )}
        >
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink"
        >
          {question.question || (
            <span className="italic text-ink-faint">Untitled question</span>
          )}
        </button>
        {flags.length > 0 && (
          <span
            className={cn(badgePill, "hidden border-hold/30 bg-hold-soft text-hold sm:inline")}
          >
            Needs review
          </span>
        )}
        {question.topic && (
          <span className={cn(badgePill, "hidden border-flight/25 bg-flight-soft text-flight md:inline")}>
            {question.topic}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1">
          <button type="button" onClick={onToggleExpand} className={iconBtn}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className={iconBtn}
            title={editing ? "Done editing" : "Edit"}
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className={cn(iconBtn, "hidden sm:flex")}
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className={cn(iconBtn, "hidden sm:flex")}
              title="Move up"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              className={cn(iconBtn, "hidden sm:flex")}
              title="Move down"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className={cn(iconBtn, "text-halt hover:bg-halt-soft hover:text-halt")}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {flags.length > 0 && (
            <p className="mb-4 border border-hold/30 bg-hold-soft px-4 py-3 text-sm text-hold">
              {flags.includes("empty") && "Question text is empty. "}
              {flags.includes("options") && "Needs at least 2 non-empty options. "}
              {flags.includes("answer") && "The marked answer is empty or invalid."}
            </p>
          )}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-ink">
              Question
            </label>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={question.question}
                  onChange={(e) => onUpdate({ question: e.target.value })}
                  rows={2}
                  className={editArea}
                />
                {question.questionImage && (
                  <img
                    src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                    alt="Question figure"
                    className="h-20 w-28 rounded-sm border border-rule bg-slate-panel object-contain"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={figureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFigureFile(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => figureInputRef.current?.click()}
                    disabled={uploadingFigure}
                    className={cn(ghostPill, "transition-colors disabled:opacity-50")}
                  >
                    <Upload size={12} />
                    {uploadingFigure
                      ? "Uploading…"
                      : question.questionImage
                        ? "Replace figure"
                        : "Attach figure"}
                  </button>
                  {question.questionImage && (
                    <button
                      type="button"
                      onClick={() => onUpdate({ questionImage: "" })}
                      className={cn(ghostPill, "transition-colors hover:bg-slate-sunk")}
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
                {figureError && (
                  <p className="text-xs text-halt">{figureError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {question.questionImage && (
                  <img
                    src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                    alt="Question figure"
                    className="h-20 w-28 shrink-0 rounded-sm border border-rule bg-slate-panel object-contain"
                  />
                )}
                <p className="text-sm text-ink">
                  {question.question || (
                    <span className="italic text-ink-faint">
                      Click edit to add question text
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">
              Options <span className="font-normal text-ink-muted">— click a letter to mark correct</span>
            </label>
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ correctAnswer: i })}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full tnum",
                    "border-2 text-sm font-semibold transition-colors",
                    question.correctAnswer === i
                      ? "border-live bg-live text-ink-inverse"
                      : "border-rule-strong text-ink-muted hover:border-ink",
                  )}
                  title={
                    question.correctAnswer === i
                      ? "Correct answer"
                      : "Mark as correct"
                  }
                >
                  {question.correctAnswer === i ? (
                    <Check size={12} />
                  ) : (
                    letterFor(i)
                  )}
                </button>
                {editing ? (
                  <input
                    type="text"
                    value={optionText(opt)}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${letterFor(i)}`}
                    className={cn(editArea, "flex-1")}
                  />
                ) : (
                  <span
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-sm border",
                      "border-rule px-4 py-3 text-[15px]",
                      question.correctAnswer === i
                        ? "border-live/25 bg-live-soft font-medium text-live"
                        : "text-ink-muted",
                    )}
                  >
                    {optionImage(opt) && (
                      <img
                        src={absoluteMediaUrl(optionImage(opt)) ?? optionImage(opt)}
                        alt={optionText(opt)}
                        className="h-16 w-24 shrink-0 rounded-sm border border-rule bg-slate-panel object-contain"
                      />
                    )}
                    {optionText(opt) || (
                      <span className="italic text-ink-faint">Empty</span>
                    )}
                    {optionImage(opt) && !optionText(opt) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                        <ImageIcon size={11} /> Figure
                      </span>
                    )}
                  </span>
                )}
                {editing && question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm",
                      "text-ink-faint hover:bg-halt-soft hover:text-halt",
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {editing && question.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className={cn(
                  "inline-flex items-center gap-2 text-xs font-semibold",
                  "text-ink-muted hover:text-ink",
                )}
              >
                <Plus size={12} /> Add option
              </button>
            )}
          </div>

          {editing && question.explanation !== undefined && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-ink">
                Explanation
              </label>
              <textarea
                value={question.explanation}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                rows={2}
                placeholder="Explain why this answer is correct…"
                className={editArea}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-ink-muted">Category:</label>
              {editing ? (
                <input
                  type="text"
                  value={question.topic}
                  onChange={(e) => onUpdate({ topic: e.target.value })}
                  placeholder="e.g. Percentage"
                  className={cn(
                    "h-12 w-44 rounded-sm border border-rule bg-slate-panel",
                    "px-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink",
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    question.topic
                      ? "border-flight/25 bg-flight-soft text-flight"
                      : "border-rule bg-slate-sunk text-ink-faint",
                  )}
                >
                  {question.topic || "Untagged"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-ink-muted">Marks:</label>
              {editing ? (
                <input
                  type="number"
                  min={1}
                  value={question.marks}
                  onChange={(e) =>
                    onUpdate({ marks: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className={cn(
                    "h-12 w-20 rounded-sm border border-rule bg-slate-panel",
                    "px-3 text-sm tnum focus:border-ink",
                  )}
                />
              ) : (
                <span className="text-sm font-semibold text-ink tnum">
                  {question.marks}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-ink-muted">Difficulty:</label>
              {editing ? (
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    onUpdate({
                      difficulty: e.target.value as QuestionDifficulty,
                    })
                  }
                  className={cn(
                    "h-12 rounded-sm border border-rule bg-slate-panel",
                    "px-3 text-sm text-ink focus:border-ink",
                  )}
                >
                  {(
                    Object.entries(DIFFICULTY_LABELS) as [
                      QuestionDifficulty,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    question.difficulty === "easy"
                      ? "border-live/25 bg-live-soft text-live"
                      : question.difficulty === "hard"
                        ? "border-halt/25 bg-halt-soft text-halt"
                        : "border-hold/30 bg-hold-soft text-hold",
                  )}
                >
                  {DIFFICULTY_LABELS[question.difficulty]}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssignmentQuestionReviewStep({ assignment, onChange }: Props) {
  const questions = assignment.questions;
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");

  const breakdown = useMemo(() => topicBreakdown(questions), [questions]);
  const reviewCount = useMemo(() => needsReviewQuestions(questions).length, [questions]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (topicFilter && item.topic !== topicFilter) return false;
      if (reviewOnly && questionFlags(item).length === 0) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q)
      );
    });
  }, [questions, search, topicFilter, reviewOnly]);

  const updateQuestion = (id: string, patch: Partial<AssignmentQuestion>) => {
    onChange({
      questions: questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });
  };

  const duplicateQuestion = (id: string) => {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const original = questions[idx];
    const copy: AssignmentQuestion = {
      ...original,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      question: `${original.question} (copy)`,
    };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    onChange({ questions: next });
  };

  const deleteQuestion = (id: string) => {
    onChange({ questions: questions.filter((q) => q.id !== id) });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ questions: next });
  };

  const addQuestion = () => {
    const q = createEmptyQuestion(assignment.totalMarks > 0 ? 1 : 1);
    onChange({ questions: [...questions, q] });
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(q.id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkCategory = () => {
    const label = bulkCategory.trim();
    if (!label || selected.size === 0) return;
    onChange({
      questions: questions.map((q) =>
        selected.has(q.id) ? { ...q, topic: label } : q,
      ),
    });
    setBulkCategory("");
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    onChange({ questions: questions.filter((q) => !selected.has(q.id)) });
    setSelected(new Set());
  };

  return (
    <div className={builderCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Question pool
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Review questions</h2>
          <p className="mt-1.5 text-[15px] text-ink-muted tnum">
            {questions.length} question{questions.length === 1 ? "" : "s"}
            {reviewCount > 0 && (
              <span className="font-semibold text-hold tnum">
                {" "}· {reviewCount} need{reviewCount === 1 ? "s" : ""} review
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={addQuestion} className={darkPill}>
          <Plus size={14} /> Add question
        </button>
      </div>

      {questions.length > 0 && (
        <div className="mt-6 space-y-3 border border-rule bg-slate-sunk p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative min-w-0 flex-1 basis-56">
              <Search
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions…"
                className={cn(
                  "h-12 w-full rounded-sm border border-rule bg-slate-panel",
                  "py-2 pr-4 pl-9 text-sm text-ink placeholder:text-ink-faint focus:border-ink",
                )}
              />
            </span>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className={filterInput}
              title="Filter by category"
            >
              <option value="">All categories</option>
              {breakdown.map(([topic, n]) => (
                <option key={topic} value={topic}>
                  {topic} ({n})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setReviewOnly((v) => !v)}
              className={cn(
                "h-12 rounded-sm border px-4 text-sm font-semibold",
                reviewOnly
                  ? "border-hold/40 bg-hold-soft text-hold"
                  : "border-rule bg-slate-panel text-ink-muted",
              )}
            >
              Needs review{reviewOnly ? " ✓" : ""}
            </button>
            <button
              type="button"
              onClick={() =>
                setCollapsed(new Set(questions.map((q) => q.id)))
              }
              className={cn(
                "h-12 rounded-sm border border-rule bg-slate-panel px-4",
                "text-sm font-semibold text-ink-muted hover:bg-slate-sunk",
              )}
            >
              Collapse all
            </button>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3">
              <span className="text-sm font-semibold text-ink-muted tnum">
                {selected.size} selected
              </span>
              <input
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Set category…"
                className={cn(
                  "h-12 w-44 rounded-sm border border-rule bg-slate-panel",
                  "px-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink",
                )}
              />
              <button
                type="button"
                onClick={applyBulkCategory}
                disabled={!bulkCategory.trim()}
                className={cn(
                  "h-11 rounded-sm bg-ink px-4",
                  "text-sm font-semibold text-ink-inverse disabled:opacity-40",
                )}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                className={cn(
                  "h-11 rounded-sm border border-halt/35 px-4",
                  "text-sm font-semibold text-halt hover:bg-halt-soft",
                )}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-sm font-semibold text-ink-faint hover:text-ink-muted"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {visible.map((q) => {
          const idx = questions.findIndex((item) => item.id === q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              total={questions.length}
              expanded={!collapsed.has(q.id)}
              selected={selected.has(q.id)}
              onToggleExpand={() => toggleExpand(q.id)}
              onToggleSelect={() => toggleSelect(q.id)}
              onUpdate={(patch) => updateQuestion(q.id, patch)}
              onDuplicate={() => duplicateQuestion(q.id)}
              onDelete={() => deleteQuestion(q.id)}
              onMoveUp={() => moveQuestion(q.id, "up")}
              onMoveDown={() => moveQuestion(q.id, "down")}
            />
          );
        })}
      </div>

      {questions.length > 0 && visible.length === 0 && (
        <p
          className={cn(
            "mt-6 border border-dashed border-rule-strong p-8",
            "text-center text-sm text-ink-muted",
          )}
        >
          No questions match your filters.
        </p>
      )}

      {questions.length === 0 && (
        <div
          className={cn(
            "mt-6 flex flex-col items-center justify-center",
            "border border-dashed border-rule-strong py-14 text-center",
          )}
        >
          <p className="text-[15px] font-semibold text-ink-muted">No questions yet</p>
          <p className="mt-1.5 text-sm text-ink-faint">
            Go back to get questions from your PDF, or add one manually.
          </p>
          <button type="button" onClick={addQuestion} className={cn(darkPill, "mt-4")}>
            <Plus size={14} /> Add question
          </button>
        </div>
      )}
    </div>
  );
}

