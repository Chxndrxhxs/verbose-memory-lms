import { useCallback, useEffect, useRef, useState } from "react";
import type { AssignmentOption, AssignmentTakeStep } from "@masterlms/shared";
import { saveAssignmentAttemptAnswers } from "@masterlms/shared";

const SENTINEL_REVIEW_NO_ANSWER = -999;

export type QuestionStatus = "review" | "answered" | "unanswered" | "not-visited";

export type QuestionRow = {
  stepId: number;
  questionId: number;
  index: number;
  status: QuestionStatus;
  selected: number | undefined;
  markedForReview: boolean;
  question: string;
  questionImage: string;
  options: AssignmentOption[];
  marks: number;
  difficulty: string;
  topic: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function flattenQuestions(steps: AssignmentTakeStep[]): QuestionRow[] {
  const rows: QuestionRow[] = [];
  let idx = 0;
  for (const step of steps) {
    for (const q of step.questions) {
      rows.push({
        stepId: step.step_id,
        questionId: q.id,
        index: idx++,
        status: "not-visited",
        selected: undefined,
        markedForReview: false,
        question: q.question,
        questionImage: q.question_image ?? "",
        options: q.options,
        marks: q.marks,
        difficulty: q.difficulty,
        topic: q.topic,
      });
    }
  }
  return rows;
}

function encodeAnswer(
  selected: number | undefined,
  marked: boolean,
): number | undefined {
  if (marked) {
    return selected !== undefined ? -selected : SENTINEL_REVIEW_NO_ANSWER;
  }
  return selected;
}

function decodeAnswer(
  val: number | undefined,
): { selected: number | undefined; marked: boolean } {
  if (val === undefined || val === null) return { selected: undefined, marked: false };
  if (val === SENTINEL_REVIEW_NO_ANSWER) return { selected: undefined, marked: true };
  if (val < 0) return { selected: Math.abs(val), marked: true };
  return { selected: val, marked: false };
}

function computeStatus(
  visited: boolean,
  selected: number | undefined,
  marked: boolean,
): QuestionStatus {
  if (marked) return "review";
  if (selected !== undefined) return "answered";
  if (visited) return "unanswered";
  return "not-visited";
}

export function useAssignmentQuestionState(
  steps: AssignmentTakeStep[],
  initialAnswers: Record<string, Record<string, number>>,
  attemptId: number,
) {
  const questionsRef = useRef<QuestionRow[]>(flattenQuestions(steps));
  const [answers, setAnswers] = useState<Record<string, Record<string, number>>>(
    initialAnswers,
  );
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const firstRun = useRef(true);

  const questions = questionsRef.current;

  const getDecoded = useCallback(
    (index: number) => {
      const q = questions[index];
      const raw = answers[String(q.stepId)]?.[String(q.questionId)];
      const decoded = decodeAnswer(raw);
      return { ...q, ...decoded, status: computeStatus(visited.has(index), decoded.selected, decoded.marked) };
    },
    [questions, answers, visited],
  );

  const questionsWithStatus: QuestionRow[] = questions.map((_, i) => getDecoded(i));

  const selectAnswer = useCallback(
    (optionIndex: number) => {
      const q = questions[currentIndex];
      setAnswers((prev) => {
        const step = { ...(prev[String(q.stepId)] ?? {}) };
        step[String(q.questionId)] = optionIndex;
        return { ...prev, [String(q.stepId)]: step };
      });
    },
    [questions, currentIndex],
  );

  const markForReview = useCallback(() => {
    const q = questions[currentIndex];
    const raw = answers[String(q.stepId)]?.[String(q.questionId)];
    const decoded = decodeAnswer(raw);
    setAnswers((prev) => {
      const step = { ...(prev[String(q.stepId)] ?? {}) };
      const encoded = encodeAnswer(decoded.selected, !decoded.marked);
      if (encoded === undefined) {
        delete step[String(q.questionId)];
      } else {
        step[String(q.questionId)] = encoded;
      }
      return { ...prev, [String(q.stepId)]: step };
    });
  }, [questions, answers, currentIndex]);

  const clearAnswer = useCallback(() => {
    const q = questions[currentIndex];
    setAnswers((prev) => {
      const step = { ...(prev[String(q.stepId)] ?? {}) };
      delete step[String(q.questionId)];
      return { ...prev, [String(q.stepId)]: step };
    });
  }, [questions, currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return;
      setCurrentIndex(index);
      setVisited((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    },
    [questions.length],
  );

  const next = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const previous = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Build answers for backend (strip sentinel for actual answers)
  const buildSubmitAnswers = useCallback((): Record<string, Record<string, number>> => {
    const result: Record<string, Record<string, number>> = {};
    for (const q of questions) {
      const raw = answers[String(q.stepId)]?.[String(q.questionId)];
      const decoded = decodeAnswer(raw);
      if (decoded.selected !== undefined) {
        const step = (result[String(q.stepId)] ?? {});
        step[String(q.questionId)] = decoded.selected;
        result[String(q.stepId)] = step;
      }
    }
    return result;
  }, [questions, answers]);

  // Auto-save with debounce
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await saveAssignmentAttemptAnswers(attemptId, answers);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, attemptId]);

  // Counts
  const decoded = questionsWithStatus;
  const counts = {
    answered: decoded.filter((q) => q.status === "answered").length,
    unanswered: decoded.filter((q) => q.status === "unanswered").length,
    review: decoded.filter((q) => q.status === "review").length,
    notVisited: decoded.filter((q) => q.status === "not-visited").length,
    total: questions.length,
  };

  return {
    questions: questionsWithStatus,
    currentIndex,
    selectAnswer,
    markForReview,
    clearAnswer,
    goTo,
    next,
    previous,
    saveStatus,
    buildSubmitAnswers,
    counts,
  };
}
