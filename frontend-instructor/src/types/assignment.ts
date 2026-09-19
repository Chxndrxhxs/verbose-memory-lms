import { optionImage, optionText, type AssignmentOption } from "@masterlms/shared";

export type AssignmentModelType = "model_1" | "model_2" | "model_3";

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
  sets: AssignmentSet[];
  randomizeQuestions: boolean;
  passingPercentage: number;
}

export interface AssignmentSet {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionIds: string[];
  questions: AssignmentQuestion[];
}

export interface AssignmentModel3Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  sets: AssignmentSet[];
  randomizeQuestions: boolean;
  passingPercentage: number;
}

export interface Assignment {
  id: string;
  modelType: AssignmentModelType;
  title: string;
  description: string;
  instructions: string;
  sourceDocument: string;
  sourceDocumentName: string;
  course: string;
  difficulty: QuestionDifficulty;
  totalMarks: number;
  passingPercentage: number;
  duration: number;
  startDate: string;
  endDate: string;
  questions: AssignmentQuestion[];
  tests: AssignmentTest[];
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
  model_1: "Direct MCQ",
  model_2: "Tests",
  model_3: "Tests & Sets",
};

export const MODEL_DESCRIPTIONS: Record<AssignmentModelType, string> = {
  model_1: "Questions generated directly from your content. Best for simple assessments.",
  model_2: "Questions organized into separate tests, each with its own duration.",
  model_3: "Tests containing sets, each with its own duration and question groupings.",
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
    sets: [],
    randomizeQuestions: false,
    passingPercentage: 50,
  };
}

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
    modelType: "model_1",
    title: "",
    description: "",
    instructions: "",
    sourceDocument: "",
    sourceDocumentName: "",
    course: "",
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

export function getModel1Questions(assignment: Assignment): AssignmentQuestion[] {
  return assignment.questions;
}

export function getModel2Questions(assignment: Assignment): AssignmentQuestion[] {
  return assignment.tests.flatMap((t) =>
    getQuestionsByIds(assignment.questions, t.questionIds)
  );
}

export function getModel3Questions(assignment: Assignment): AssignmentQuestion[] {
  return assignment.model3Tests.flatMap((t) =>
    t.sets.flatMap((s) => getQuestionsByIds(assignment.questions, s.questionIds))
  );
}

export function getModelQuestions(
  assignment: Assignment,
  model: AssignmentModelType
): AssignmentQuestion[] {
  if (model === "model_1") return getModel1Questions(assignment);
  if (model === "model_2") return getModel2Questions(assignment);
  return getModel3Questions(assignment);
}

export function countModel2Questions(assignment: Assignment): number {
  return assignment.tests.reduce((sum, t) => sum + t.questionIds.length, 0);
}

export function countModel3Questions(assignment: Assignment): number {
  return assignment.model3Tests.reduce(
    (sum, t) => sum + t.sets.reduce((s, set) => s + set.questionIds.length, 0),
    0
  );
}

export function countQuestions(assignment: Assignment, model: AssignmentModelType): number {
  if (model === "model_1") return assignment.questions.length;
  if (model === "model_2") return countModel2Questions(assignment);
  return countModel3Questions(assignment);
}

export function getTotalQuestions(assignment: Assignment): number {
  return assignment.questions.length;
}

export function getTotalMarks(assignment: Assignment): number {
  return assignment.questions.reduce((sum, q) => sum + q.marks, 0);
}

export function getModelTotalMarks(
  assignment: Assignment,
  model: AssignmentModelType
): number {
  return getModelQuestions(assignment, model).reduce((sum, q) => sum + q.marks, 0);
}

const MAX_TEST_QUESTIONS = 12;
const MAX_SET_QUESTIONS = 8;

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

export function buildModel2FromQuestions(
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

export function buildModel3FromQuestions(
  questions: AssignmentQuestion[],
  totalDuration: number
): AssignmentModel3Test[] {
  if (questions.length === 0) return [];
  const tests: AssignmentModel3Test[] = [];
  const groups = groupQuestionsByTopic(questions);
  for (const [topic, group] of groups) {
    const test = createEmptyModel3Test(topic);
    test.sets = chunkArray(group, MAX_SET_QUESTIONS).map((chunk, i) => {
      const set = createEmptySet(`Set ${i + 1}`);
      set.questionIds = chunk.map((q) => q.id);
      set.questions = chunk;
      return set;
    });
    const setDurations = proportionalDurations(
      totalDuration,
      test.sets.map((s) => s.questionIds.length)
    );
    test.sets.forEach((s, i) => (s.duration = setDurations[i]));
    test.duration = test.sets.reduce((sum, s) => sum + s.duration, 0);
    tests.push(test);
  }
  return tests;
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

  let tests = assignment.tests.map(syncTest);
  let model3Tests = assignment.model3Tests.map((t) => ({
    ...t,
    sets: t.sets.map(syncSet),
  }));

  const model2Placed = new Set(tests.flatMap((t) => t.questionIds));
  const model3Placed = new Set(model3Tests.flatMap((t) => t.sets.flatMap((s) => s.questionIds)));
  const newIds = assignment.questions
    .map((q) => q.id)
    .filter((id) => !model2Placed.has(id) && !model3Placed.has(id));

  if (newIds.length > 0) {
    if (tests.length === 0 && assignment.questions.length > 0) {
      tests = buildModel2FromQuestions(assignment.questions, assignment.duration);
    } else if (tests.length > 0) {
      const first = tests[0];
      const merged: AssignmentTest = {
        ...first,
        questionIds: [...first.questionIds, ...newIds],
        questions: [...first.questions, ...getQuestionsByIds(pool, newIds)],
      };
      tests = [merged, ...tests.slice(1)];
    }

    if (model3Tests.length === 0 && assignment.questions.length > 0) {
      model3Tests = buildModel3FromQuestions(assignment.questions, assignment.duration);
    } else if (model3Tests.length > 0 && model3Tests[0].sets.length > 0) {
      model3Tests = model3Tests.map((t, i) => {
        if (i !== 0) return t;
        const firstSet = t.sets[0];
        return {
          ...t,
          sets: [
            {
              ...firstSet,
              questionIds: [...firstSet.questionIds, ...newIds],
              questions: [...firstSet.questions, ...getQuestionsByIds(pool, newIds)],
            },
            ...t.sets.slice(1),
          ],
        };
      });
    } else if (model3Tests.length > 0) {
      const set = createEmptySet("Set 1");
      set.questionIds = newIds;
      set.questions = getQuestionsByIds(pool, newIds);
      model3Tests = model3Tests.map((t, i) => (i === 0 ? { ...t, sets: [set] } : t));
    }
  }

  return { ...assignment, tests, model3Tests };
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
  const validOptions = q.options.filter((o) => optionText(o).trim() || o.image);
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
  }
  if (!assignment.sourceDocument && !assignment.sourceDocumentName) {
    errors.push({ field: "sourceDocument", message: "Source PDF is required" });
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
    if (test.questionIds.length === 0) {
      errors.push({ field: `test_questions_${test.id}`, message: "Test must contain at least one question" });
    }
  }

  for (const test of assignment.model3Tests) {
    if (!test.title.trim()) {
      errors.push({ field: `test_title_${test.id}`, message: "Test title is required" });
    }
    if (test.sets.length === 0) {
      errors.push({ field: `test_sets_${test.id}`, message: "Test must contain at least one set" });
    }
    for (const set of test.sets) {
      if (!set.title.trim()) {
        errors.push({ field: `set_title_${set.id}`, message: "Set title is required" });
      }
      if (set.duration <= 0) {
        errors.push({ field: `set_duration_${set.id}`, message: "Set duration must be greater than 0" });
      }
      if (set.questionIds.length === 0) {
        errors.push({ field: `set_questions_${set.id}`, message: "Set must contain at least one question" });
      }
    }
  }

  return errors;
}

export function getCourseOptions(): string[] {
  return [
    "Engineering",
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Business",
    "Design",
    "Other",
  ];
}
