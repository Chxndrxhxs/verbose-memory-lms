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
import { optionImage, optionText } from "@masterlms/shared";
import type {
  Assignment,
  AssignmentSet,
  AssignmentTest,
  AssignmentQuestion,
} from "../types/assignment";
import {
  createEmptyTest,
  createEmptySet,
  createEmptyQuestion,
} from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

function SetPanel({
  set,
  targetTests,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveToTest,
}: {
  set: AssignmentSet;
  targetTests: { id: string; title: string }[];
  onUpdate: (patch: Partial<AssignmentSet>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveToTest: (testId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const addQuestion = () => {
    onUpdate({ questions: [...set.questions, createEmptyQuestion()] });
  };

  const deleteQuestion = (id: string) => {
    onUpdate({ questions: set.questions.filter((q) => q.id !== id) });
  };

  const moveQuestion = (id: string, dir: "up" | "down") => {
    const idx = set.questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= set.questions.length) return;
    const next = [...set.questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdate({ questions: next });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 ml-4">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          {expanded ? (
            <ChevronUp size={14} className="text-zinc-400" />
          ) : (
            <ChevronDown size={14} className="text-zinc-400" />
          )}
          <Layers size={14} className="text-zinc-500" />
          {editingTitle ? (
            <input
              autoFocus
              value={set.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-sm font-semibold outline-none"
            />
          ) : (
            <span
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
            >
              {set.title}
            </span>
          )}
          <span className="text-[10px] text-zinc-400">
            {set.questions.length} Q · {set.duration}m
          </span>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <input
            type="number"
            min={1}
            value={set.duration}
            onChange={(e) =>
              onUpdate({ duration: Math.max(1, Number(e.target.value) || 1) })
            }
            className="w-14 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs outline-none focus:border-zinc-900"
            title="Duration (minutes)"
          />
          <span className="text-[10px] text-zinc-400">min</span>
          {targetTests.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) onMoveToTest(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10px] outline-none"
              title="Move set to another test"
            >
              <option value="" disabled>
                Move to test…
              </option>
              {targetTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={onDuplicate}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 px-3 py-3">
          {set.questions.map((q, i) => (
            <div
              key={q.id}
              className="mb-1.5 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-600">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-zinc-700">
                {q.question || (
                  <span className="text-zinc-400 italic">Untitled</span>
                )}
              </span>
              <span className="text-[10px] text-zinc-400">
                {q.options.filter((o) => optionText(o).trim() || Boolean(optionImage(o))).length} opts
              </span>
              <button
                onClick={() => moveQuestion(q.id, "up")}
                disabled={i === 0}
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => moveQuestion(q.id, "down")}
                disabled={i === set.questions.length - 1}
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
              >
                <ArrowDown size={12} />
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-red-500"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={addQuestion}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
          >
            <Plus size={11} /> Add question
          </button>
        </div>
      )}
    </div>
  );
}

function TestPanel({
  test,
  modelType,
  testTitles,
  index,
  totalTests,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddSet,
  onMoveUp,
  onMoveDown,
  onMoveSetToTest,
  availableQuestions,
}: {
  test: AssignmentTest;
  modelType: "model_2" | "model_3";
  testTitles: { id: string; title: string }[];
  index: number;
  totalTests: number;
  onUpdate: (patch: Partial<AssignmentTest>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddSet: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveSetToTest: (setId: string) => (testId: string) => void;
  availableQuestions: AssignmentQuestion[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);

  const addQuestionToTest = () => {
    onUpdate({ questions: [...test.questions, createEmptyQuestion()] });
  };

  const updateSet = (setId: string, patch: Partial<AssignmentSet>) => {
    onUpdate({
      sets: test.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    });
  };

  const deleteSet = (setId: string) => {
    onUpdate({ sets: test.sets.filter((s) => s.id !== setId) });
  };

  const duplicateSet = (setId: string) => {
    const original = test.sets.find((s) => s.id === setId);
    if (!original) return;
    const copy: AssignmentSet = {
      ...createEmptySet(`${original.title} (copy)`),
      questions: original.questions.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      })),
    };
    const idx = test.sets.findIndex((s) => s.id === setId);
    const next = [...test.sets];
    next.splice(idx + 1, 0, copy);
    onUpdate({ sets: next });
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
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          {expanded ? (
            <ChevronUp size={14} className="text-zinc-400" />
          ) : (
            <ChevronDown size={14} className="text-zinc-400" />
          )}
          <ListChecks size={16} className="text-zinc-600" />
          {editingTitle ? (
            <input
              autoFocus
              value={test.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-sm font-bold outline-none"
            />
          ) : (
            <span
              className="text-sm font-bold text-zinc-900 cursor-pointer hover:text-zinc-700"
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
            <label className="text-[10px] text-zinc-400">Duration:</label>
            <input
              type="number"
              min={1}
              value={test.duration}
              onChange={(e) =>
                onUpdate({
                  duration: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-14 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs outline-none focus:border-zinc-900"
            />
            <span className="text-[10px] text-zinc-400">min</span>
          </div>
          {index > 0 && (
            <button
              onClick={onMoveUp}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Reorder test up"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {index < totalTests - 1 && (
            <button
              onClick={onMoveDown}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Reorder test down"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3">
          <div className="mb-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">
              Description
            </label>
            <input
              type="text"
              value={test.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Test description (optional)"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:bg-white"
            />
          </div>

          {modelType === "model_3" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Sets ({test.sets.length})
                </span>
                <button
                  onClick={onAddSet}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                >
                  <Plus size={11} /> Add set
                </button>
              </div>
              {test.sets.map((s) => (
                <SetPanel
                  key={s.id}
                  set={s}
                  targetTests={testTitles.filter((t) => t.id !== test.id)}
                  onUpdate={(patch) => updateSet(s.id, patch)}
                  onDelete={() => deleteSet(s.id)}
                  onDuplicate={() => duplicateSet(s.id)}
                  onMoveToTest={(targetTestId) =>
                    onMoveSetToTest(s.id)(targetTestId)
                  }
                />
              ))}
              {test.sets.length === 0 && (
                <p className="py-3 text-center text-xs text-zinc-400">
                  No sets yet. Click "Add set" to start.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
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
                            questions: [
                              ...test.questions,
                              { ...q, id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
                            ],
                          });
                        }
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs outline-none"
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
                    onClick={addQuestionToTest}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                  >
                    <Plus size={11} /> Add question
                  </button>
                </div>
              </div>
              {test.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-700">
                    {q.question || (
                      <span className="text-zinc-400 italic">Untitled</span>
                    )}
                  </span>
                  <button
                    onClick={() => moveQuestionInTest(q.id, "up")}
                    disabled={i === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moveQuestionInTest(q.id, "down")}
                    disabled={i === test.questions.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-zinc-600 disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() =>
                      onUpdate({
                        questions: test.questions.filter(
                          (tq) => tq.id !== q.id
                        ),
                      })
                    }
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:text-red-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AssignmentTestConfigStep({ assignment, onChange }: Props) {
  if (assignment.modelType === "model_1") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">Configuration</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Model 1 (Direct MCQ) doesn&apos;t require test/set configuration.
          Questions are placed directly under the assignment.
        </p>
        <div className="mt-4 rounded-xl bg-zinc-50 p-4">
          <p className="text-xs text-zinc-600">
            Your assignment has {assignment.questions.length} question(s) with a
            total duration of {assignment.duration} minute(s). Adjust these in
            the Basic Info step or the Preview step.
          </p>
        </div>
      </div>
    );
  }

  // Drafts created before question arrays were added can still be opened safely.
  // The canonical pool remains on `assignment.questions`; these arrays only hold
  // each model's arranged questions.
  const tests = assignment.tests.map((test) => ({
    ...test,
    questions: test.questions ?? [],
    sets: (test.sets ?? []).map((set) => ({
      ...set,
      questions: set.questions ?? [],
    })),
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
      sets: original.sets.map((s) => ({
        ...createEmptySet(s.title),
        duration: s.duration,
        questions: s.questions.map((q) => ({
          ...q,
          id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        })),
      })),
    };
    const idx = tests.findIndex((t) => t.id === testId);
    const next = [...tests];
    next.splice(idx + 1, 0, copy);
    onChange({ tests: next });
  };

  const addSetToTest = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;
    const setNum = test.sets.length + 1;
    updateTest(testId, {
      sets: [...test.sets, createEmptySet(`Set ${setNum}`)],
    });
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

  const buildMoveSetToTest =
    (setId: string) =>
    (targetTestId: string) => {
      const sourceIdx = tests.findIndex((t) =>
        t.sets.some((s) => s.id === setId)
      );
      const source = tests[sourceIdx];
      const set = source?.sets.find((s) => s.id === setId);
      if (!source || !set) return;
      const targetIdx = tests.findIndex(
        (t) => t.id === targetTestId
      );
      if (targetIdx < 0) return;
      const next = tests.map((t, i) => {
        if (i === sourceIdx) {
          return { ...t, sets: t.sets.filter((s) => s.id !== setId) };
        }
        if (i === targetIdx) {
          return { ...t, sets: [...t.sets, set] };
        }
        return t;
      });
      onChange({ tests: next });
    };

  const availableQuestions = assignment.questions.filter(
    (q) =>
      !tests.some((t) =>
        t.questions.some((tq) => tq.id === q.id)
      )
  );

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            Configure {assignment.modelType === "model_2" ? "Tests" : "Tests & Sets"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Organize questions into{" "}
            {assignment.modelType === "model_2"
              ? "tests"
              : "tests and sets"}
            {" "}with individual durations.
          </p>
        </div>
        <button
          onClick={addTest}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Plus size={13} /> Add test
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {tests.map((test, i) => (
          <TestPanel
            key={test.id}
            test={test}
            modelType={assignment.modelType as "model_2" | "model_3"}
            testTitles={tests.map((t) => ({
              id: t.id,
              title: t.title,
            }))}
            index={i}
            totalTests={tests.length}
            onUpdate={(patch) => updateTest(test.id, patch)}
            onDelete={() => deleteTest(test.id)}
            onDuplicate={() => duplicateTest(test.id)}
            onAddSet={() => addSetToTest(test.id)}
            onMoveUp={() => moveTest(test.id, "up")}
            onMoveDown={() => moveTest(test.id, "down")}
            onMoveSetToTest={buildMoveSetToTest}
            availableQuestions={availableQuestions}
          />
        ))}
      </div>

      {tests.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-600">No tests yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            Add a test to organize your questions.
          </p>
          <button
            onClick={addTest}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} /> Add test
          </button>
        </div>
      )}
    </div>
  );
}
