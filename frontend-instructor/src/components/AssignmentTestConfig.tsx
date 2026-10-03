import { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  ListChecks,
  ArrowUp,
  ArrowDown,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import type {
  Assignment,
  AssignmentTest,
  AssignmentQuestion,
} from "../types/assignment";
import {
  createEmptyTest,
  createEmptyQuestion,
  buildMockFromQuestions,
  formatMinutes,
  totalConfiguredMinutes,
  unplacedPoolQuestions,
} from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

function TestPanel({
  test,
  index,
  totalTests,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  availableQuestions,
}: {
  test: AssignmentTest;
  index: number;
  totalTests: number;
  onUpdate: (patch: Partial<AssignmentTest>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  availableQuestions: AssignmentQuestion[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);

  const addQuestionToTest = () => {
    onUpdate({ questions: [...test.questions, createEmptyQuestion()] });
  };

  const moveQuestionInTest = (id: string, dir: "up" | "down") => {
    const idx = test.questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= test.questions.length) return;
    const next = [...test.questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdate({ questions: next });
  };

  return (
    <div className="rounded-sm border border-rule bg-slate-panel">
      <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          {expanded ? (
            <ChevronUp size={14} className="text-ink-faint" />
          ) : (
            <ChevronDown size={14} className="text-ink-faint" />
          )}
          <ListChecks size={16} className="text-ink-muted" />
          {editingTitle ? (
            <input
              autoFocus
              value={test.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="rounded-sm border border-rule bg-slate-panel px-2 py-1 text-sm font-semibold text-ink focus:border-ink"
            />
          ) : (
            <span
              className="cursor-pointer text-sm font-semibold text-ink hover:text-ink-muted"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
            >
              {test.title}
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Duration:</label>
            <input
              type="number"
              min={1}
              value={test.duration}
              onChange={(e) =>
                onUpdate({
                  duration: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-16 rounded-sm border border-rule bg-slate-sunk px-2 py-1 text-xs tnum focus:border-ink"
            />
            <span className="text-[10px] text-ink-faint">min</span>
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-faint hover:bg-slate-sunk hover:text-ink"
              title="Reorder test up"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {index < totalTests - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-faint hover:bg-slate-sunk hover:text-ink"
              title="Reorder test down"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onDuplicate}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-faint hover:bg-slate-sunk hover:text-ink"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-faint hover:bg-halt-soft hover:text-halt"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3">
          <div className="mb-2">
            <label className="mb-1 block text-xs font-semibold text-ink-muted">
              Description
            </label>
            <input
              type="text"
              value={test.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Test description (optional)"
              className="w-full rounded-sm border border-rule bg-slate-sunk px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:bg-slate-panel"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted tnum">
                Questions ({test.questions.length})
              </span>
              <div className="flex items-center gap-2">
                {availableQuestions.length > 0 && (
                  <select
                    onChange={(e) => {
                      const qId = e.target.value;
                      const q = availableQuestions.find(
                        (aq) => aq.id === qId
                      );
                      if (q) {
                        onUpdate({
                          questionIds: [...test.questionIds, q.id],
                          questions: [...test.questions, { ...q }],
                        });
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="rounded-sm border border-rule bg-slate-sunk px-2 py-1 text-xs text-ink focus:border-ink"
                  >
                    <option value="" disabled>
                      Assign question…
                    </option>
                    {availableQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.question.slice(0, 40) || "Untitled"}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={addQuestionToTest}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  <Plus size={11} /> Add question
                </button>
              </div>
            </div>
            {test.questions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded-sm bg-slate-sunk px-3 py-2 text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rule text-[9px] font-semibold text-ink-muted tnum">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-muted">
                  {q.question || (
                    <span className="italic text-ink-faint">Untitled</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => moveQuestionInTest(q.id, "up")}
                  disabled={i === 0}
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestionInTest(q.id, "down")}
                  disabled={i === test.questions.length - 1}
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      questions: test.questions.filter(
                        (tq) => tq.id !== q.id
                      ),
                    })
                  }
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-ink-faint hover:text-halt"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UnplacedPanel({
  unplaced,
  targets,
  emptyTargets,
  onPlace,
}: {
  unplaced: AssignmentQuestion[];
  targets: { id: string; label: string }[];
  emptyTargets: boolean;
  onPlace: (question: AssignmentQuestion, targetId: string) => void;
}) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  return (
    <div className="mt-4 border border-hold/30 bg-hold-soft p-4">
      <p className="text-xs font-semibold text-hold tnum">
        {unplaced.length} pooled question{unplaced.length === 1 ? "" : "s"} not in
        any section — they won&apos;t reach students until placed.
      </p>
      {emptyTargets ? (
        <p className="mt-1 text-xs text-hold">
          Add a test below (or auto-arrange) to place them.
        </p>
      ) : (
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
          {unplaced.map((q) => {
            const chosen = choices[q.id] ?? targets[0]?.id ?? "";
            return (
              <li
                key={q.id}
                className="flex items-center gap-2 rounded-sm bg-slate-panel px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                  {q.question || <span className="italic text-ink-faint">Untitled</span>}
                </span>
                <select
                  value={chosen}
                  onChange={(e) =>
                    setChoices((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  className={cn(
                    "max-w-36 truncate rounded-sm border border-rule bg-slate-panel",
                    "px-2 py-1 text-[11px] text-ink focus:border-ink",
                  )}
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => chosen && onPlace(q, chosen)}
                  className={cn(
                    "shrink-0 rounded-sm bg-ink px-3 py-1 text-[11px]",
                    "font-semibold text-ink-inverse",
                  )}
                >
                  Place
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AssignmentTestConfigStep({ assignment, onChange }: Props) {
  if (assignment.modelType === "practice") {
    return (
      <div className={builderCardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Sections
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Configuration</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          Practice doesn&apos;t require test/set configuration.
          Questions are placed directly under the assignment.
        </p>
        <div className="mt-6 border border-rule bg-slate-sunk p-5">
          <p className="text-sm text-ink-muted tnum">
            Your assignment has {assignment.questions.length} question(s) with a
            total duration of {assignment.duration} minute(s). Adjust these in
            the Basic Info step or the Preview step.
          </p>
        </div>
      </div>
    );
  }

  // Drafts created before question arrays were added can still be opened safely.
  const tests = assignment.tests.map((test) => ({
    ...test,
    questions: test.questions ?? [],
  }));

  const addTest = () => {
    const testNum = tests.length + 1;
    onChange({
      tests: [...tests, createEmptyTest(`Test ${testNum}`)],
    });
  };

  const updateTest = (testId: string, patch: Partial<AssignmentTest>) => {
    onChange({
      tests: tests.map((t) =>
        t.id === testId ? { ...t, ...patch } : t
      ),
    });
  };

  const deleteTest = (testId: string) => {
    onChange({
      tests: tests.filter((t) => t.id !== testId),
    });
  };

  const duplicateTest = (testId: string) => {
    const original = tests.find((t) => t.id === testId);
    if (!original) return;
    const copy: AssignmentTest = {
      ...createEmptyTest(`${original.title} (copy)`),
      description: original.description,
      duration: original.duration,
      questions: original.questions.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      })),
    };
    const idx = tests.findIndex((t) => t.id === testId);
    const next = [...tests];
    next.splice(idx + 1, 0, copy);
    onChange({ tests: next });
  };

  const moveTest = (testId: string, dir: "up" | "down") => {
    const idx = tests.findIndex((t) => t.id === testId);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= tests.length) return;
    const next = [...tests];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ tests: next });
  };

  const availableQuestions = assignment.questions.filter(
    (q) =>
      !tests.some((t) =>
        t.questions.some((tq) => tq.id === q.id)
      )
  );
  const unplaced = unplacedPoolQuestions(assignment);
  const placedCount = assignment.questions.length - unplaced.length;
  const totalMinutes = totalConfiguredMinutes(assignment);

  const autoArrange = () => {
    if (assignment.questions.length === 0) return;
    if (
      tests.length > 0 &&
      !window.confirm(
        "Replace the current test arrangement with an automatic split by category?"
      )
    ) {
      return;
    }
    onChange({
      tests: buildMockFromQuestions(assignment.questions, assignment.duration),
    });
  };

  const placeUnplaced = (question: AssignmentQuestion, targetId: string) => {
    onChange({
      tests: tests.map((t) =>
        t.id === targetId
          ? {
              ...t,
              questionIds: [...t.questionIds, question.id],
              questions: [...t.questions, { ...question }],
            }
          : t
      ),
    });
  };

  const setOptions = tests.map((t) => ({ id: t.id, label: t.title }));

  return (
    <div className={builderCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Sections
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Configure mock test sections
          </h2>
          <p className="mt-1.5 text-[15px] text-ink-muted tnum">
            {tests.length} test{tests.length === 1 ? "" : "s"} · {placedCount} of{" "}
            {assignment.questions.length} questions placed
            {unplaced.length > 0 && (
              <span className="font-semibold text-hold tnum">
                {" "}· {unplaced.length} unplaced
              </span>
            )}{" "}
            · {formatMinutes(totalMinutes)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autoArrange}
            disabled={assignment.questions.length === 0}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border",
              "border-rule-strong px-4 py-2 text-xs font-semibold",
              "hover:bg-slate-sunk disabled:opacity-40",
            )}
            title="Split the pool into tests by category"
          >
            <Layers size={13} /> Auto-arrange
          </button>
          <button
            type="button"
            onClick={addTest}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm bg-ink",
              "px-4 py-2 text-xs font-semibold text-ink-inverse hover:opacity-90",
            )}
          >
            <Plus size={13} /> Add test
          </button>
        </div>
      </div>

      {unplaced.length > 0 && (
        <UnplacedPanel
          unplaced={unplaced}
          targets={setOptions}
          emptyTargets={tests.length === 0}
          onPlace={placeUnplaced}
        />
      )}

      <div className="mt-4 space-y-4">
        {tests.map((test, i) => (
          <TestPanel
            key={test.id}
            test={test}
            index={i}
            totalTests={tests.length}
            onUpdate={(patch) => updateTest(test.id, patch)}
            onDelete={() => deleteTest(test.id)}
            onDuplicate={() => duplicateTest(test.id)}
            onMoveUp={() => moveTest(test.id, "up")}
            onMoveDown={() => moveTest(test.id, "down")}
            availableQuestions={availableQuestions}
          />
        ))}
      </div>

      {tests.length === 0 && (
        <div
          className={cn(
            "mt-6 flex flex-col items-center justify-center rounded-sm",
            "border border-dashed border-rule-strong py-12 text-center",
          )}
        >
          <p className="text-sm font-semibold text-ink-muted">No tests yet</p>
          <p className="mt-1 text-xs text-ink-faint">
            Add a test to organize your questions.
          </p>
          <button
            type="button"
            onClick={addTest}
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-sm bg-ink",
              "px-4 py-2 text-xs font-semibold text-ink-inverse",
            )}
          >
            <Plus size={13} /> Add test
          </button>
        </div>
      )}
    </div>
  );
}
