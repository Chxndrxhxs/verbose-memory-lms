import { useState } from "react";
import {
  Pencil,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImageIcon,
} from "@masterlms/shared";
import { absoluteMediaUrl, optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type { Assignment, AssignmentQuestion, QuestionDifficulty } from "../types/assignment";
import { createEmptyQuestion, DIFFICULTY_LABELS } from "../types/assignment";
import { generateSampleQuestions } from "../utils/questionGenerator";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

function QuestionCard({
  question,
  index,
  total,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: AssignmentQuestion;
  index: number;
  total: number;
  onUpdate: (patch: Partial<AssignmentQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingOptions, setRegeneratingOptions] = useState(false);

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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const generated = generateSampleQuestions({
        count: 1,
        difficulty: question.difficulty,
        marksPerQuestion: question.marks,
        numberOfOptions: question.options.length,
        generateExplanations: Boolean(question.explanation),
        topicDistribution: question.topic ? { [question.topic]: 1 } : {},
      })[0];
      if (generated) {
        onUpdate({
          question: generated.question,
          options: generated.options,
          correctAnswer: generated.correctAnswer,
          explanation:
            question.explanation || generated.explanation,
          topic: generated.topic || question.topic,
        });
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateOptions = async () => {
    setRegeneratingOptions(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const generated = generateSampleQuestions({
        count: 1,
        difficulty: question.difficulty,
        marksPerQuestion: question.marks,
        numberOfOptions: question.options.length,
        generateExplanations: Boolean(question.explanation),
        topicDistribution: question.topic ? { [question.topic]: 1 } : {},
      })[0];
      if (generated) {
        const newOptions = [...generated.options];
        onUpdate({
          options: newOptions,
          correctAnswer: generated.correctAnswer,
        });
      }
    } finally {
      setRegeneratingOptions(false);
    }
  };

  const letterFor = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-1 text-zinc-300">
          <GripVertical size={14} />
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
          {index + 1}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
          {question.question || (
            <span className="text-zinc-400 italic">Untitled question</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Regenerate question"
          >
            <RefreshCw
              size={14}
              className={regenerating ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={onDuplicate}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          {index > 0 && (
            <button
              onClick={onMoveUp}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Move up"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {index < total - 1 && (
            <button
              onClick={onMoveDown}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Move down"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">
              Question
            </label>
            {editing ? (
              <textarea
                value={question.question}
                onChange={(e) => onUpdate({ question: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white resize-none"
              />
            ) : (
              <div className="flex items-start gap-3">
                {question.questionImage && (
                  <img
                    src={absoluteMediaUrl(question.questionImage) ?? question.questionImage}
                    alt="Question figure"
                    className="h-20 w-28 shrink-0 rounded-lg border border-zinc-200 object-cover"
                  />
                )}
                <p className="text-sm text-zinc-800">
                  {question.question || (
                    <span className="text-zinc-400 italic">Click edit to add question text</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-500">
              Options
            </label>
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => onUpdate({ correctAnswer: i })}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    question.correctAnswer === i
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 text-zinc-500 hover:border-zinc-400"
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
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex flex-1 items-center gap-2.5 rounded-lg border border-zinc-100 px-3 py-2 text-sm",
                      question.correctAnswer === i
                        ? "bg-emerald-50 font-medium text-emerald-800"
                        : "text-zinc-700"
                    )}
                  >
                    {optionImage(opt) && (
                      <img
                        src={absoluteMediaUrl(optionImage(opt)) ?? optionImage(opt)}
                        alt={optionText(opt)}
                        className="h-10 w-14 shrink-0 rounded-md border border-zinc-200 object-cover"
                      />
                    )}
                    {optionText(opt) || (
                      <span className="text-zinc-400 italic">Empty</span>
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
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {editing && question.options.length < 6 && (
              <button
                onClick={addOption}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
              >
                <Plus size={12} /> Add option
              </button>
            )}
          </div>

          {editing && question.explanation !== undefined && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-zinc-500">
                Explanation
              </label>
              <textarea
                value={question.explanation}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                rows={2}
                placeholder="Explain why this answer is correct…"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white resize-none"
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">Marks:</label>
              {editing ? (
                <input
                  type="number"
                  min={1}
                  value={question.marks}
                  onChange={(e) =>
                    onUpdate({ marks: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-16 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                />
              ) : (
                <span className="text-xs font-semibold text-zinc-700">
                  {question.marks}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">Difficulty:</label>
              {editing ? (
                <select
                  value={question.difficulty}
                  onChange={(e) =>
                    onUpdate({
                      difficulty: e.target.value as QuestionDifficulty,
                    })
                  }
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs outline-none focus:border-zinc-900"
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
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    question.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : question.difficulty === "hard"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  )}
                >
                  {DIFFICULTY_LABELS[question.difficulty]}
                </span>
              )}
            </div>
          </div>

          {question.topic && (
            <div className="mt-2">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                Topic: {question.topic}
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={regenerating ? "animate-spin" : ""}
              />
              Regenerate
            </button>
            <button
              onClick={handleRegenerateOptions}
              disabled={regeneratingOptions}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={regeneratingOptions ? "animate-spin" : ""}
              />
              Regenerate options
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssignmentQuestionReviewStep({ assignment, onChange }: Props) {
  const questions = assignment.questions;

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
    onChange({
      questions: [...questions, q],
    });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Review Questions</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {questions.length} question(s) — edit, reorder, or add new ones.
          </p>
        </div>
        <button
          onClick={addQuestion}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus size={13} /> Add question
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            onUpdate={(patch) => updateQuestion(q.id, patch)}
            onDuplicate={() => duplicateQuestion(q.id)}
            onDelete={() => deleteQuestion(q.id)}
            onMoveUp={() => moveQuestion(q.id, "up")}
            onMoveDown={() => moveQuestion(q.id, "down")}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-600">
            No questions yet
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Go back to generate questions, or add one manually.
          </p>
          <button
            onClick={addQuestion}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} /> Add question
          </button>
        </div>
      )}
    </div>
  );
}
