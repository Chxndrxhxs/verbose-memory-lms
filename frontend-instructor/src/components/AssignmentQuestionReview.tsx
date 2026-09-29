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
  "h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-900";

const iconBtn = cn(
  "flex h-10 w-10 items-center justify-center rounded-xl",
  "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
);

const badgePill = "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold";

const editArea = cn(
  "w-full resize-none rounded-xl border border-zinc-200 bg-white",
  "px-4 py-3 text-[15px] outline-none focus:border-zinc-900",
);

const ghostPill = cn(
  "inline-flex h-11 items-center gap-1.5 rounded-full border border-zinc-200",
  "px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50",
);

const darkPill = cn(
  "inline-flex h-11 items-center gap-1.5 rounded-full bg-zinc-900",
  "px-5 text-sm font-semibold text-white hover:opacity-90",
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
        "rounded-2xl border bg-white",
        flags.length > 0 ? "border-amber-300" : "border-zinc-200/70",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5",
          "sm:gap-4 sm:px-5 sm:py-4",
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          title="Select for bulk actions"
          className="h-4 w-4 shrink-0 accent-zinc-900"
        />
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            "bg-zinc-900 text-[10px] font-bold text-white",
          )}
        >
          {index + 1}
        </span>
        <button
          onClick={onToggleExpand}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-zinc-800"
        >
          {question.question || (
            <span className="italic text-zinc-400">Untitled question</span>
          )}
        </button>
        {flags.length > 0 && (
          <span
            className={cn(badgePill, "hidden bg-amber-100 text-amber-800 sm:inline")}
          >
            Needs review
          </span>
        )}
        {question.topic && (
          <span className={cn(badgePill, "hidden bg-sky-100 text-sky-700 md:inline")}>
            {question.topic}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button onClick={onToggleExpand} className={iconBtn}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className={iconBtn}
            title={editing ? "Done editing" : "Edit"}
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />}
          </button>
          <button
            onClick={onDuplicate}
            className={cn(iconBtn, "hidden sm:flex")}
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          {index > 0 && (
            <button
              onClick={onMoveUp}
              className={cn(iconBtn, "hidden sm:flex")}
              title="Move up"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {index < total - 1 && (
            <button
              onClick={onMoveDown}
              className={cn(iconBtn, "hidden sm:flex")}
              title="Move down"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            className={cn(iconBtn, "text-red-400 hover:bg-red-50 hover:text-red-600")}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {flags.length > 0 && (
            <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {flags.includes("empty") && "Question text is empty. "}
              {flags.includes("options") && "Needs at least 2 non-empty options. "}
              {flags.includes("answer") && "The marked answer is empty or invalid."}
            </p>
          )}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-zinc-900">
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
                    className="h-20 w-28 rounded-lg border border-zinc-200 bg-white object-contain"
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
                      onClick={() => onUpdate({ questionImage: "" })}
                      className={cn(ghostPill, "transition-colors hover:bg-zinc-50")}
                    >
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
                {figureError && (
                  <p className="text-xs text-red-600">{figureError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {question.questionImage && (
                  <img
                    src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                    alt="Question figure"
                    className="h-20 w-28 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain"
                  />
                )}
                <p className="text-sm text-zinc-800">
                  {question.question || (
                    <span className="italic text-zinc-400">
                      Click edit to add question text
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-zinc-900">
              Options <span className="font-normal text-zinc-500">— click a letter to mark correct</span>
            </label>
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <button
                  onClick={() => onUpdate({ correctAnswer: i })}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "border-2 text-sm font-bold transition-colors",
                    question.correctAnswer === i
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 text-zinc-500 hover:border-zinc-400",
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
                      "flex flex-1 items-center gap-2.5 rounded-xl border",
                      "border-zinc-100 px-4 py-3 text-[15px]",
                      question.correctAnswer === i
                        ? "bg-emerald-50 font-medium text-emerald-800"
                        : "text-zinc-700",
                    )}
                  >
                    {optionImage(opt) && (
                      <img
                        src={absoluteMediaUrl(optionImage(opt)) ?? optionImage(opt)}
                        alt={optionText(opt)}
                        className="h-16 w-24 shrink-0 rounded-md border border-zinc-200 bg-white object-contain"
                      />
                    )}
                    {optionText(opt) || (
                      <span className="italic text-zinc-400">Empty</span>
                    )}
                    {optionImage(opt) && !optionText(opt) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                        <ImageIcon size={11} /> Figure
                      </span>
                    )}
                  </span>
                )}
                {editing && question.options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      "text-zinc-400 hover:bg-red-50 hover:text-red-500",
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {editing && question.options.length < 6 && (
              <button
                onClick={addOption}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold",
                  "text-zinc-500 hover:text-zinc-700",
                )}
              >
                <Plus size={12} /> Add option
              </button>
            )}
          </div>

          {editing && question.explanation !== undefined && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-semibold text-zinc-900">
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
            <div className="flex items-center gap-2.5">
              <label className="text-sm text-zinc-500">Category:</label>
              {editing ? (
                <input
                  type="text"
                  value={question.topic}
                  onChange={(e) => onUpdate({ topic: e.target.value })}
                  placeholder="e.g. Percentage"
                  className={cn(
                    "h-12 w-44 rounded-xl border border-zinc-200 bg-white",
                    "px-3.5 text-sm outline-none focus:border-zinc-900",
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    question.topic
                      ? "bg-sky-100 text-sky-700"
                      : "bg-zinc-100 text-zinc-400",
                  )}
                >
                  {question.topic || "Untagged"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-sm text-zinc-500">Marks:</label>
              {editing ? (
                <input
                  type="number"
                  min={1}
                  value={question.marks}
                  onChange={(e) =>
                    onUpdate({ marks: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className={cn(
                    "h-12 w-20 rounded-xl border border-zinc-200 bg-white",
                    "px-3.5 text-sm outline-none focus:border-zinc-900",
                  )}
                />
              ) : (
                <span className="text-sm font-semibold text-zinc-700">
                  {question.marks}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-sm text-zinc-500">Difficulty:</label>
              {editing ? (
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    onUpdate({
                      difficulty: e.target.value as QuestionDifficulty,
                    })
                  }
                  className={cn(
                    "h-12 rounded-xl border border-zinc-200 bg-white",
                    "px-3.5 text-sm outline-none focus:border-zinc-900",
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
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    question.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : question.difficulty === "hard"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700",
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
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
            Question pool
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">Review questions</h2>
          <p className="mt-1.5 text-[15px] text-zinc-500">
            {questions.length} question{questions.length === 1 ? "" : "s"}
            {reviewCount > 0 && (
              <span className="font-semibold text-amber-700">
                {" "}· {reviewCount} need{reviewCount === 1 ? "s" : ""} review
              </span>
            )}
          </p>
        </div>
        <button onClick={addQuestion} className={darkPill}>
          <Plus size={14} /> Add question
        </button>
      </div>

      {questions.length > 0 && (
        <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative min-w-0 flex-1 basis-56">
              <Search
                size={15}
                className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions…"
                className={cn(
                  "h-12 w-full rounded-xl border border-zinc-200 bg-white",
                  "py-2 pr-4 pl-11 text-sm outline-none focus:border-zinc-900",
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
              onClick={() => setReviewOnly((v) => !v)}
              className={cn(
                "h-12 rounded-xl border px-4 text-sm font-semibold",
                reviewOnly
                  ? "border-amber-400 bg-amber-100 text-amber-800"
                  : "border-zinc-200 bg-white text-zinc-500",
              )}
            >
              Needs review{reviewOnly ? " ✓" : ""}
            </button>
            <button
              onClick={() =>
                setCollapsed(new Set(questions.map((q) => q.id)))
              }
              className={cn(
                "h-12 rounded-xl border border-zinc-200 bg-white px-4",
                "text-sm font-semibold text-zinc-500",
              )}
            >
              Collapse all
            </button>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-zinc-200 pt-3">
              <span className="text-sm font-semibold text-zinc-600">
                {selected.size} selected
              </span>
              <input
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Set category…"
                className={cn(
                  "h-12 w-44 rounded-xl border border-zinc-200 bg-white",
                  "px-3.5 text-sm outline-none focus:border-zinc-900",
                )}
              />
              <button
                onClick={applyBulkCategory}
                disabled={!bulkCategory.trim()}
                className={cn(
                  "h-11 rounded-full bg-zinc-900 px-4",
                  "text-sm font-semibold text-white disabled:opacity-40",
                )}
              >
                Apply
              </button>
              <button
                onClick={deleteSelected}
                className={cn(
                  "h-11 rounded-full border border-red-200 px-4",
                  "text-sm font-semibold text-red-600 hover:bg-red-50",
                )}
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm font-semibold text-zinc-400 hover:text-zinc-600"
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
            "mt-6 rounded-2xl border border-dashed border-zinc-300 p-8",
            "text-center text-sm text-zinc-500",
          )}
        >
          No questions match your filters.
        </p>
      )}

      {questions.length === 0 && (
        <div
          className={cn(
            "mt-6 flex flex-col items-center justify-center rounded-2xl",
            "border border-dashed border-zinc-300 py-14 text-center",
          )}
        >
          <p className="text-[15px] font-semibold text-zinc-600">No questions yet</p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Go back to get questions from your PDF, or add one manually.
          </p>
          <button onClick={addQuestion} className={cn(darkPill, "mt-4")}>
            <Plus size={14} /> Add question
          </button>
        </div>
      )}
    </div>
  );
}

