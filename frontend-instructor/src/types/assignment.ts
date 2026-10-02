import {
  hasReadableTitle,
  isValidTotalMarks,
  optionImage,
  optionText,
  TITLE_MSG,
  TOTAL_MARKS_MSG,
  type AssignmentOption,
  type ExamModule,
} from "@masterlms/shared";

export type AssignmentModelType = ExamModule;

/** Map pre-rename draft codes to current modules so old drafts keep working. */
export function normalizeModelType(raw: unknown): AssignmentModelType {
  if (raw === "model_1" || raw === "practice") return "practice";
  return "mock";
}

export type AssignmentStatus = "draft" | "published" | "archived";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionType = "mcq";

export interface AssignmentQuestion {
  id: string;
  question: string;
  questionImage: string;
  options: AssignmentOption[];
  correctAnswer: number;
  explanation: string;
  marks: number;
  difficulty: QuestionDifficulty;
  topic: string;
}

export interface AssignmentTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionIds: string[];
  questions: AssignmentQuestion[];
  randomizeQuestions: boolean;
  passingPercentage: number;
}

/** @deprecated suite removed; kept so old drafts still parse. */
export interface AssignmentSet {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionIds: string[];
  questions: AssignmentQuestion[];
}

/** @deprecated suite removed; kept so old drafts still parse. */
export interface AssignmentModel3Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  sets: AssignmentSet[];
  randomizeQuestions: boolean;
  passingPercentage: number;
}

/** @deprecated suite removed; kept so old drafts still parse. */
export type LegacyModel3Tests = AssignmentModel3Test[];

export interface Assignment {
  id: string;
  modelType: AssignmentModelType;
  title: string;
  description: string;
  instructions: string;
  sourceDocument: string;
  sourceDocumentName: string;
  /** Exam board: the Category id this assignment is filed under. */
  board: number | null;
  /** Read-only "Exam · Subject" label for list cards; not editable here. */
  subjectLabel?: string;
  difficulty: QuestionDifficulty;
  totalMarks: number;
  passingPercentage: number;
  duration: number;
  startDate: string;
  endDate: string;
  questions: AssignmentQuestion[];
  tests: AssignmentTest[];
  /** @deprecated suite removed; read for old drafts only. */
  model3Tests: AssignmentModel3Test[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  negativeMarking: boolean;
  negativeMarks: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentBasicInfo {
  title: string;
  description: string;
  instructions: string;
  course: string;
  difficulty: QuestionDifficulty;
  totalMarks: number;
  passingPercentage: number;
  startDate: string;
  endDate: string;
}

export interface QuestionGenerationConfig {
  numberOfQuestions: number;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marksPerQuestion: number;
  numberOfOptions: number;
  generateExplanations: boolean;
  distributeEvenly: boolean;
  topicDistribution: Record<string, number>;
}

export interface PdfUploadState {
  file: File | null;
  url: string;
  fileName: string;
  fileSize: number;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
  extractedText: string;
}

export interface AssignmentValidationError {
  field: string;
  message: string;
}

export interface TopicInfo {
  name: string;
  questionCount: number;
}

export const MODEL_LABELS: Record<AssignmentModelType, string> = {
  practice: "Practice",
  mock: "Mock Test",
};

export const MODEL_DESCRIPTIONS: Record<AssignmentModelType, string> = {
  practice: "Untimed practice with inline explanations. Best for study.",
  mock: "Testbook-style sections: each category (Quant, English, …) is a timed section.",
};

export const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const STATUS_LABELS: Record<AssignmentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const STATUS_COLORS: Record<AssignmentStatus, string> = {
  draft: "bg-yellow-400 text-zinc-900",
  published: "bg-emerald-500 text-white",
  archived: "bg-zinc-300 text-zinc-700",
};

export function createEmptyQuestion(marks = 1): AssignmentQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    questionImage: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    marks,
    difficulty: "medium",
    topic: "",
  };
}

/** @deprecated suite removed. */
export function createEmptySet(title?: string): AssignmentSet {
  return {
    id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || "Set 1",
    description: "",
    duration: 30,
    questionIds: [],
    questions: [],
  };
}

export function createEmptyTest(title?: string): AssignmentTest {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || "Test 1",
    description: "",
    duration: 60,
    questionIds: [],
    questions: [],
    randomizeQuestions: false,
    passingPercentage: 50,
  };
}

/** @deprecated suite removed. */
export function createEmptyModel3Test(title?: string): AssignmentModel3Test {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || "Test 1",
    description: "",
    duration: 60,
    sets: [],
    randomizeQuestions: false,
    passingPercentage: 50,
  };
}

export function createEmptyAssignment(): Assignment {
  return {
    id: "",
    modelType: "practice",
    title: "",
    description: "",
    instructions: "",
    sourceDocument: "",
    sourceDocumentName: "",
    board: null,
    difficulty: "medium",
    totalMarks: 0,
    passingPercentage: 50,
    duration: 60,
    startDate: "",
    endDate: "",
    questions: [],
    tests: [],
    model3Tests: [],
    randomizeQuestions: false,
    randomizeOptions: false,
    negativeMarking: false,
    negativeMarks: 0,
    status: "draft",
    createdAt: "",
    updatedAt: "",
  };
}

export function getQuestionsByIds(
  pool: AssignmentQuestion[],
  ids: string[]
): AssignmentQuestion[] {
  const byId = new Map(pool.map((q) => [q.id, q]));
  return ids
    .map((id) => byId.get(id))
    .filter((q): q is AssignmentQuestion => Boolean(q));
}

export function getPracticeQuestions(assignment: Assignment): AssignmentQuestion[] {
  return assignment.questions;
}

export function getMockQuestions(assignment: Assignment): AssignmentQuestion[] {
  return assignment.tests.flatMap((t) =>
    getQuestionsByIds(assignment.questions, t.questionIds)
  );
}

/** @deprecated suite removed; use getMockQuestions. */
export function getSuiteQuestions(assignment: Assignment): AssignmentQuestion[] {
  return getMockQuestions(assignment);
}

export function getModelQuestions(
  assignment: Assignment,
  model: AssignmentModelType
): AssignmentQuestion[] {
  if (model === "practice") return getPracticeQuestions(assignment);
  return getMockQuestions(assignment);
}

export function countMockQuestions(assignment: Assignment): number {
  return assignment.tests.reduce((sum, t) => sum + t.questionIds.length, 0);
}

/** @deprecated suite removed; use countMockQuestions. */
export function countSuiteQuestions(assignment: Assignment): number {
  return countMockQuestions(assignment);
}

export function countQuestions(assignment: Assignment, model: AssignmentModelType): number {
  if (model === "practice") return assignment.questions.length;
  return countMockQuestions(assignment);
}

export function getTotalQuestions(assignment: Assignment): number {
  if (assignment.modelType === "practice") return assignment.questions.length;
  return countQuestions(assignment, assignment.modelType);
}

export function getTotalMarks(assignment: Assignment): number {
  if (assignment.modelType === "practice") {
    return assignment.questions.reduce((sum, q) => sum + q.marks, 0);
  }
  return getModelTotalMarks(assignment, assignment.modelType);
}

export function getModelTotalMarks(
  assignment: Assignment,
  model: AssignmentModelType
): number {
  return getModelQuestions(assignment, model).reduce((sum, q) => sum + q.marks, 0);
}

const MAX_TEST_QUESTIONS = 12;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function groupQuestionsByTopic(questions: AssignmentQuestion[]): Map<string, AssignmentQuestion[]> {
  const groups = new Map<string, AssignmentQuestion[]>();
  for (const q of questions) {
    const key = q.topic.trim() || "Untitled Section";
    const list = groups.get(key) ?? [];
    list.push(q);
    groups.set(key, list);
  }
  return groups;
}

function proportionalDurations(total: number, counts: number[]): number[] {
  const sum = counts.reduce((acc, c) => acc + c, 0);
  if (sum <= 0) return counts.map(() => total);
  return counts.map((c) => Math.max(1, Math.round((total * c) / sum)));
}

export function buildMockFromQuestions(
  questions: AssignmentQuestion[],
  totalDuration: number
): AssignmentTest[] {
  if (questions.length === 0) return [];
  const tests: AssignmentTest[] = [];
  const groups = groupQuestionsByTopic(questions);
  for (const [topic, group] of groups) {
    chunkArray(group, MAX_TEST_QUESTIONS).forEach((chunk, i) => {
      const test = createEmptyTest(i === 0 ? topic : `${topic} (${i + 1})`);
      test.questionIds = chunk.map((q) => q.id);
      test.questions = chunk;
      tests.push(test);
    });
  }
  const durations = proportionalDurations(
    totalDuration,
    tests.map((t) => t.questionIds.length)
  );
  tests.forEach((t, i) => (t.duration = durations[i]));
  return tests;
}

/** @deprecated suite removed; use buildMockFromQuestions. */
export function buildSuiteFromQuestions(
  questions: AssignmentQuestion[],
  totalDuration: number,
): AssignmentModel3Test[] {
  return buildMockFromQuestions(questions, totalDuration).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    duration: t.duration,
    sets: [],
    randomizeQuestions: t.randomizeQuestions,
    passingPercentage: t.passingPercentage,
  }));
}

export function ensureModelsCollectPool(assignment: Assignment): Assignment {
  const poolIds = new Set(assignment.questions.map((q) => q.id));
  const pool = assignment.questions;

  const syncTest = (t: AssignmentTest): AssignmentTest => {
    const questionIds = t.questionIds.filter((id) => poolIds.has(id));
    return { ...t, questionIds, questions: getQuestionsByIds(pool, questionIds) };
  };
  const syncSet = (s: AssignmentSet): AssignmentSet => {
    const questionIds = s.questionIds.filter((id) => poolIds.has(id));
    return { ...s, questionIds, questions: getQuestionsByIds(pool, questionIds) };
  };

  let tests: AssignmentTest[] = assignment.tests.map((t) => {
    const synced = syncTest(t);
    const raw = t as AssignmentTest & { sets?: AssignmentSet[] };
    return { ...synced, sets: (raw.sets ?? []).map(syncSet) } as AssignmentTest & {
      sets: AssignmentSet[];
    };
  }) as AssignmentTest[];
  const legacy = tests.length === 0 ? assignment.model3Tests : [];
  const legacySets = legacy.flatMap((t) => t.sets.map(syncSet));

  const placed = new Set([
    ...tests.flatMap((t) => t.questionIds),
    ...tests.flatMap(
      (t) => ((t as AssignmentTest & { sets?: AssignmentSet[] }).sets ?? []).flatMap((s) => s.questionIds),
    ),
    ...legacySets.flatMap((s) => s.questionIds),
  ]);
  const newIds = assignment.questions
    .map((q) => q.id)
    .filter((id) => !placed.has(id));

  if (newIds.length > 0) {
    if (tests.length === 0 && assignment.questions.length > 0) {
      tests = buildMockFromQuestions(assignment.questions, assignment.duration);
    } else if (tests.length > 0) {
      const first = tests[0];
      const merged: AssignmentTest = {
        ...first,
        questionIds: [...first.questionIds, ...newIds],
        questions: [...first.questions, ...getQuestionsByIds(pool, newIds)],
      };
      tests = [merged, ...tests.slice(1)];
    }
  }

  return { ...assignment, tests, model3Tests: [] };
}

export function poolQuestionIdsChanged(
  before: AssignmentQuestion[],
  after: AssignmentQuestion[]
): boolean {
  if (before.length !== after.length) return true;
  const seen = new Set(before.map((q) => q.id));
  for (const q of after) {
    if (!seen.has(q.id)) return true;
  }
  const seenAfter = new Set(after.map((q) => q.id));
  for (const q of before) {
    if (!seenAfter.has(q.id)) return true;
  }
  return false;
}

function pushQuestionErrors(
  q: AssignmentQuestion,
  errors: AssignmentValidationError[]
): void {
  if (!q.question.trim()) {
    errors.push({ field: `question_${q.id}`, message: "Question text cannot be empty" });
  }
  const validOptions = q.options.filter((o) => optionText(o).trim() || optionImage(o));
  if (validOptions.length < 2) {
    errors.push({ field: `options_${q.id}`, message: "At least 2 options are required" });
  }
  const correct = q.options[q.correctAnswer];
  const correctValid =
    q.correctAnswer >= 0 &&
    q.correctAnswer < q.options.length &&
    typeof correct !== "undefined" &&
    (optionText(correct).trim() || Boolean(optionImage(correct)));
  if (!correctValid) {
    errors.push({ field: `correct_${q.id}`, message: "A valid correct answer is required" });
  }
  if (q.marks <= 0) {
    errors.push({ field: `marks_${q.id}`, message: "Marks must be greater than 0" });
  }
}

export function validateAssignment(assignment: Assignment): AssignmentValidationError[] {
  const errors: AssignmentValidationError[] = [];

  if (!assignment.title.trim()) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (!hasReadableTitle(assignment.title)) {
    // A title of only punctuation ("!@#$%^&*()") reads as broken in the
    // student and admin modules (RAM-35).
    errors.push({ field: "title", message: TITLE_MSG });
  }

  if (assignment.board == null) {
    // A published assignment with no board cannot be found by learners in the
    // catalog (RAM-34).
    errors.push({ field: "board", message: "Select an exam board" });
  }

  if (!isValidTotalMarks(assignment.totalMarks)) {
    // A wildly large total is a typo and breaks scoring downstream (RAM-44).
    errors.push({ field: "totalMarks", message: TOTAL_MARKS_MSG });
  }

  if (assignment.questions.length === 0) {
    errors.push({ field: "questions", message: "At least one question is required" });
  }
  for (const q of assignment.questions) {
    pushQuestionErrors(q, errors);
  }

  for (const test of assignment.tests) {
    if (!test.title.trim()) {
      errors.push({ field: `test_title_${test.id}`, message: "Test title is required" });
    }
    if (test.duration <= 0) {
      errors.push({
        field: `test_duration_${test.id}`,
        message: "Test duration must be greater than 0",
      });
    }
    if (assignment.modelType === "mock" && test.questionIds.length === 0) {
      errors.push({ field: `test_questions_${test.id}`, message: "Test must contain at least one question" });
    }
  }

  return errors;
}

/** The snake_case body the assignment endpoints accept. `board` is the exam
 *  board a published assignment is filed under in the learner catalog.
 *  `inter_category` is kept only so existing drafts round-trip unchanged.
 */
export type AssignmentWritePayload = {
  title: string;
  description: string;
  instructions: string;
  difficulty: QuestionDifficulty;
  inter_category: number | null;
  board: number | null;
  status: AssignmentStatus;
  source_document: string;
  source_document_name: string;
  passing_percentage: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  draft_data: Assignment;
};

export function formatMinutes(mins: number): string {
  const total = Math.max(0, Math.round(mins));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export type QuestionFlag = "empty" | "options" | "answer";

export function questionFlags(q: AssignmentQuestion): QuestionFlag[] {
  const flags: QuestionFlag[] = [];
  if (!q.question.trim()) flags.push("empty");
  const valid = q.options.filter((o) => optionText(o).trim() || optionImage(o));
  if (valid.length < 2) flags.push("options");
  const correct = q.options[q.correctAnswer];
  const correctValid =
    q.correctAnswer >= 0 &&
    q.correctAnswer < q.options.length &&
    typeof correct !== "undefined" &&
    (optionText(correct).trim() || Boolean(optionImage(correct)));
  if (!correctValid) flags.push("answer");
  return flags;
}

export function needsReviewQuestions(
  questions: AssignmentQuestion[]
): AssignmentQuestion[] {
  return questions.filter((q) => questionFlags(q).length > 0);
}

export function topicBreakdown(questions: AssignmentQuestion[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    const key = q.topic.trim() || "Untagged";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function placedQuestionIds(assignment: Assignment): Set<string> {
  const ids = new Set<string>();
  for (const test of assignment.tests) {
    for (const id of test.questionIds) ids.add(id);
    const raw = test as AssignmentTest & { sets?: AssignmentSet[] };
    for (const set of raw.sets ?? []) {
      for (const id of set.questionIds) ids.add(id);
    }
  }
  return ids;
}

/** Pool questions not yet placed into any test (mock only). */
export function unplacedPoolQuestions(assignment: Assignment): AssignmentQuestion[] {
  if (assignment.modelType === "practice") return [];
  const placed = placedQuestionIds(assignment);
  return assignment.questions.filter((q) => !placed.has(q.id));
}

export function totalConfiguredMinutes(assignment: Assignment): number {
  if (assignment.modelType === "practice") return assignment.duration;
  return assignment.tests.reduce((sum, t) => sum + (t.duration || 0), 0);
}
