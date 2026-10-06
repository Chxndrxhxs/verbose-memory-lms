import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  type BankQuestion,
} from "@masterlms/shared";
import { optionImage, optionText } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass, builderFieldClass, builderLabelClass } from "../lib/builder";
import {
  categoryBreakdown,
  draftOptionText,
  totalPackMarks,
  type PackQuestionDraft,
} from "../types/pack";

type Props = {
  questions: PackQuestionDraft[];
  addedBankIds: number[];
  onUpdateQuestion: (id: string, patch: Partial<PackQuestionDraft>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onAddCustom: () => void;
  bankQuery: string;
  onBankQuery: (q: string) => void;
  bankTopic: string;
  onBankTopic: (q: string) => void;
  bankDifficulty: string;
  onBankDifficulty: (q: string) => void;
  bankTopics: string[];
  bankResults: BankQuestion[];
  bankLoading: boolean;
  onAddFromBank: (ids: number[]) => void;
  onGenerate: (count: number, difficulty: string, topic: string) => void;
  generating: boolean;
  locked: boolean;
};

type OptionList = BankQuestion["options"];

const editorInput = cn(builderFieldClass);

const filterInput = cn(
  "h-12 rounded-sm border border-rule bg-slate-panel px-4",
  "text-sm text-ink focus:border-ink",
);

const darkButton = cn(
  "inline-flex h-12 items-center rounded-sm bg-ink px-5 text-sm font-semibold text-ink-inverse",
  "hover:opacity-90 disabled:opacity-50",
);

const genField = cn(builderFieldClass);

const iconButton = "shrink-0 rounded-sm p-3 text-ink-faint hover:bg-slate-sunk hover:text-ink";

function CategoryBadge({ topic }: { topic: string }) {
  return (
    <span
      className={cn(
        "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        topic
          ? "border-flight/25 bg-flight-soft text-flight"
          : "border-rule bg-slate-sunk text-ink-faint",
      )}
    >
      {topic || "Untagged"}
    </span>
  );
}

function OptionPreview({ options, correct }: { options: OptionList; correct: number }) {
  return (
    <ul className="mt-3 space-y-2">
      {options.map((opt, i) => (
        <li
          key={i}
          className={cn(
            "flex items-center gap-2 rounded-sm border px-3 py-2 text-sm",
            i === correct
              ? "border-live/25 bg-live-soft font-medium text-live"
              : "border-rule text-ink-muted",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full tnum",
              "text-[10px] font-semibold",
              i === correct ? "bg-live text-ink-inverse" : "bg-slate-sunk text-ink-muted",
            )}
          >
            {i === correct ? <Check size={11} /> : String.fromCharCode(65 + i)}
          </span>
          {optionImage(opt) && (
            <img
              src={optionImage(opt)}
              alt=""
              className="h-10 w-16 shrink-0 border border-rule bg-slate-panel object-contain"
            />
          )}
          <span className="min-w-0 truncate">{optionText(opt) || "(empty)"}</span>
        </li>
      ))}
    </ul>
  );
}

function BankRow({
  bank,
  added,
  onAdd,
}: {
  bank: BankQuestion;
  added: boolean;
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-rule p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-[15px] font-medium text-ink">{bank.question}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted tnum">
            <CategoryBadge topic={bank.topic} />
            <span>
              {bank.assignment_title} · {bank.difficulty} · {bank.marks}{" "}
              {Number(bank.marks) === 1 ? "mark" : "marks"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={iconButton}
          title={expanded ? "Collapse" : "Preview"}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={added}
          className={cn(
            "h-11 shrink-0 rounded-sm px-4 text-sm font-semibold",
            added
              ? "bg-slate-sunk text-ink-faint"
              : "bg-ink text-ink-inverse hover:opacity-90",
          )}
        >
          {added ? "Added" : "Add"}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 border-t border-rule pt-2">
          <OptionPreview options={bank.options} correct={bank.correct_answer} />
          {bank.explanation && (
            <p className="mt-2 text-sm text-ink-muted">
              <span className="font-semibold text-ink">Why:</span> {bank.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddedRow({
  question,
  index,
  total,
  locked,
  onUpdate,
  onRemove,
  onMove,
}: {
  question: PackQuestionDraft;
  index: number;
  total: number;
  locked: boolean;
  onUpdate: (patch: Partial<PackQuestionDraft>) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const [expanded, setExpanded] = useState(!question.question);
  const isEmpty = !question.question.trim();

  const setOptionText = (idx: number, value: string) => {
    const next = [...question.options];
    const prev = next[idx];
    next[idx] =
      typeof prev === "object" && prev !== null && "image" in prev && prev.image
        ? { text: value, image: prev.image }
        : value;
    onUpdate({ options: next });
  };

  const removeOption = (idx: number) => {
    if (question.options.length <= 2) return;
    const next = question.options.filter((_, i) => i !== idx);
    const correct =
      question.correctAnswer >= next.length
        ? 0
        : question.correctAnswer > idx
          ? question.correctAnswer - 1
          : question.correctAnswer;
    onUpdate({ options: next, correctAnswer: correct });
  };

  return (
    <div
      className={cn(
        "border bg-slate-panel p-4 sm:p-5",
        isEmpty ? "border-hold/40" : "border-rule",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full tnum",
            "bg-slate-sunk text-xs font-semibold text-ink-muted",
          )}
        >
          {index + 1}
        </span>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[15px] font-medium text-ink">
            {question.question || (
              <span className="italic text-hold">Empty, expand to write</span>
            )}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted tnum">
            <CategoryBadge topic={question.topic} />
            <span>
              {question.options.map(draftOptionText).filter(Boolean).length} options ·{" "}
              {question.difficulty} · {question.marks}{" "}
              {question.marks === 1 ? "mark" : "marks"}
            </span>
          </span>
        </button>
        {!locked && (
          <span className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onMove("up")}
              disabled={index === 0}
              className={cn(iconButton, "disabled:opacity-30")}
              title="Move up"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => onMove("down")}
              disabled={index === total - 1}
              className={cn(iconButton, "disabled:opacity-30")}
              title="Move down"
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-sm p-2 text-halt hover:bg-halt-soft hover:text-halt"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-rule pt-4">
          <textarea
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            rows={2}
            disabled={locked}
            placeholder="Write the question…"
            className={cn(editorInput, "resize-none")}
          />
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ correctAnswer: i })}
                  disabled={locked}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full tnum",
                    "border-2 text-xs font-semibold",
                    question.correctAnswer === i
                      ? "border-live bg-live text-ink-inverse"
                      : "border-rule-strong text-ink-muted",
                  )}
                  title="Mark as correct"
                >
                  {question.correctAnswer === i ? (
                    <Check size={12} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </button>
                <input
                  value={draftOptionText(opt)}
                  onChange={(e) => setOptionText(i, e.target.value)}
                  disabled={locked}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={cn(editorInput, "min-w-0 flex-1")}
                />
                {!locked && question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className={cn(
                      "shrink-0 rounded-sm p-2 text-ink-faint",
                      "hover:bg-halt-soft hover:text-halt",
                    )}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            {!locked && question.options.length < 6 && (
              <button
                type="button"
                onClick={() => onUpdate({ options: [...question.options, ""] })}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-semibold",
                  "text-ink-muted hover:text-ink",
                )}
              >
                <Plus size={13} /> Add option
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-ink-muted">
              Category
              <input
                value={question.topic}
                onChange={(e) => onUpdate({ topic: e.target.value })}
                disabled={locked}
                placeholder="e.g. Percentage"
                className={cn(editorInput)}
              />
            </label>
            <label className="block text-xs font-semibold text-ink-muted">
              Difficulty
              <select
                value={question.difficulty}
                onChange={(e) => onUpdate({ difficulty: e.target.value })}
                disabled={locked}
                className={cn(editorInput)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-ink-muted">
              Marks
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={question.marks}
                onChange={(e) =>
                  onUpdate({ marks: Math.max(0.5, Number(e.target.value) || 1) })
                }
                disabled={locked}
                className={cn(editorInput, "tnum")}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function PackQuestionsStep(props: Props) {
  const {
    questions,
    addedBankIds,
    onUpdateQuestion,
    onRemove,
    onMove,
    onAddCustom,
    bankQuery,
    onBankQuery,
    bankTopic,
    onBankTopic,
    bankDifficulty,
    onBankDifficulty,
    bankTopics,
    bankResults,
    bankLoading,
    onAddFromBank,
    onGenerate,
    generating,
    locked,
  } = props;

  const [tab, setTab] = useState<"bank" | "generate">("bank");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [genTopic, setGenTopic] = useState("");

  const breakdown = categoryBreakdown(questions);
  const addable = bankResults.filter((b) => !addedBankIds.includes(b.id));
  const unit = questions.length === 1 ? "question" : "questions";
  const summary = `${questions.length} ${unit} · ${totalPackMarks(questions)} marks`;

  return (
    <div className="space-y-6">
      <div className={builderCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Step 2 of 4 · Build
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Questions</h2>
            <p className="mt-1.5 text-[15px] text-ink-muted tnum">
              {questions.length === 0
                ? "Import from your bank, generate, or write your own."
                : summary}
            </p>
          </div>
          {!locked && (
            <button
              type="button"
              onClick={onAddCustom}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-sm border",
                "border-rule-strong px-5 text-sm font-semibold hover:bg-slate-sunk",
              )}
            >
              <Plus size={14} /> Blank question
            </button>
          )}
        </div>

        {breakdown.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {breakdown.map(([topic, n]) => (
              <span
                key={topic}
                className={cn(
                  "rounded-sm border border-rule bg-slate-sunk px-3 py-1.5 text-xs tnum",
                  "font-semibold text-ink-muted",
                )}
              >
                {topic} · {n}
              </span>
            ))}
          </div>
        )}

        {locked && (
          <p className="mt-5 border border-hold/30 bg-hold-soft p-4 text-sm text-hold">
            This pack is published — unpublish it to change questions.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {questions.map((q, i) => (
            <AddedRow
              key={q.id}
              question={q}
              index={i}
              total={questions.length}
              locked={locked}
              onUpdate={(patch) => onUpdateQuestion(q.id, patch)}
              onRemove={() => onRemove(q.id)}
              onMove={(dir) => onMove(q.id, dir)}
            />
          ))}
          {questions.length === 0 && (
            <p
              className={cn(
                "border border-dashed border-rule-strong p-8",
                "text-center text-sm text-ink-muted",
              )}
            >
              No questions yet — use the bank, the generator, or a blank question below.
            </p>
          )}
        </div>
      </div>

      {!locked && (
        <div className={builderCardClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Add more
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Add questions</h2>
            </div>
            <div className="flex rounded-sm border border-rule bg-slate-sunk p-0.5 text-sm font-semibold">
              {(["bank", "generate"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "h-10 rounded-sm px-4 capitalize",
                    tab === t
                      ? "bg-slate-panel text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {t === "bank" ? "Question bank" : "Generate"}
                </button>
              ))}
            </div>
          </div>

          {tab === "bank" && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <input
                  value={bankQuery}
                  onChange={(e) => onBankQuery(e.target.value)}
                  placeholder="Search your saved questions…"
                  className={cn(filterInput, "min-w-0 flex-1")}
                />
                <select
                  value={bankTopic}
                  onChange={(e) => onBankTopic(e.target.value)}
                  className={filterInput}
                  title="Filter by category"
                >
                  <option value="">All categories</option>
                  {bankTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={bankDifficulty}
                  onChange={(e) => onBankDifficulty(e.target.value)}
                  className={filterInput}
                  title="Filter by difficulty"
                >
                  <option value="">Any difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              {addable.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-ink-muted tnum">
                    {addable.length} result{addable.length === 1 ? "" : "s"} you
                    haven&apos;t added
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddFromBank(addable.map((b) => b.id))}
                    className={cn(
                      "h-11 rounded-sm border border-rule px-4",
                      "text-sm font-semibold text-ink-muted hover:bg-slate-sunk",
                    )}
                  >
                    Add all visible
                  </button>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {bankLoading && <p className="text-sm text-ink-muted">Searching…</p>}
                {!bankLoading && bankResults.length === 0 && (
                  <p className="text-sm text-ink-muted">
                    No saved questions match. Create an assignment first — its questions
                    land here automatically.
                  </p>
                )}
                {bankResults.map((b) => (
                  <BankRow
                    key={b.id}
                    bank={b}
                    added={addedBankIds.includes(b.id)}
                    onAdd={() => onAddFromBank([b.id])}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "generate" && (
            <div className="mt-6 border border-rule bg-slate-sunk p-5 sm:p-6">
              <div className="flex flex-wrap items-end gap-4">
                <label className={builderLabelClass}>
                  Count
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className={cn(genField, "w-28 tnum")}
                  />
                </label>
                <label className={builderLabelClass}>
                  Difficulty
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={genField}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                <label className={cn(builderLabelClass, "min-w-0 flex-1")}>
                  Category label
                  <input
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="e.g. Percentage (required)"
                    className={cn(genField, "w-full")}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onGenerate(count, difficulty, genTopic.trim())}
                  disabled={generating}
                  className={darkButton}
                >
                  {generating ? "Generating…" : "Generate & add"}
                </button>
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                AI-written from the model&apos;s own subject knowledge. Give a
                category so they arrive tagged instead of random.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
