import {
  optionText,
  type AssignmentOption,
  type BankQuestion,
  type ExamModule,
  type PackAdminDetail,
} from "@masterlms/shared";

export interface PackQuestionDraft {
  id: string;
  question: string;
  questionImage: string;
  options: AssignmentOption[];
  correctAnswer: number;
  explanation: string;
  marks: number;
  difficulty: string;
  topic: string;
  source: Record<string, unknown>;
}

export interface PackInfoDraft {
  title: string;
  description: string;
  cover: string;
  board: number | null;
  price: string;
  original_price: string;
  allowed_modules: ExamModule[];
  max_attempts: number;
  test_size: number;
  test_duration_seconds: number;
  set_size: number;
  set_duration_seconds: number;
  execution_mode: string;
  passing_percentage: string;
  negative_marking: boolean;
}

export function emptyPackInfo(): PackInfoDraft {
  return {
    title: "",
    description: "",
    cover: "",
    board: null,
    price: "0",
    original_price: "0",
    allowed_modules: ["mock"],
    max_attempts: 0,
    test_size: 25,
    test_duration_seconds: 1800,
    set_size: 10,
    set_duration_seconds: 600,
    execution_mode: "sequential",
    passing_percentage: "50",
    negative_marking: true,
  };
}

export function packDetailToInfo(pack: PackAdminDetail): PackInfoDraft {
  return {
    title: pack.title,
    description: pack.description,
    cover: pack.cover ?? "",
    board: pack.board?.id ?? null,
    price: pack.price,
    original_price: pack.original_price,
    allowed_modules: pack.allowed_modules,
    max_attempts: pack.max_attempts,
    test_size: pack.test_size,
    test_duration_seconds: pack.test_duration_seconds,
    set_size: pack.set_size,
    set_duration_seconds: pack.set_duration_seconds,
    execution_mode: pack.execution_mode,
    passing_percentage: pack.passing_percentage,
    negative_marking: pack.negative_marking,
  };
}

export function packDetailToQuestions(pack: PackAdminDetail): PackQuestionDraft[] {
  return pack.questions.map((q) => ({
    id: `pq_${q.id}`,
    question: q.question,
    questionImage: q.question_image,
    options: q.options,
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    marks: Number(q.marks),
    difficulty: q.difficulty,
    topic: q.topic,
    source: {},
  }));
}

export function bankToDraft(bank: BankQuestion): PackQuestionDraft {
  return {
    id: `bank_${bank.id}_${Date.now()}`,
    question: bank.question,
    questionImage: bank.question_image,
    options: bank.options,
    correctAnswer: bank.correct_answer,
    explanation: bank.explanation,
    marks: Number(bank.marks),
    difficulty: bank.difficulty,
    topic: bank.topic,
    source: { kind: "bank", assignment_id: bank.assignment_id, bank_id: bank.id },
  };
}

export function rawToDraft(raw: unknown): PackQuestionDraft {
  const record = (raw ?? {}) as Record<string, unknown>;
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    question: String(record.question ?? ""),
    questionImage: String(record.questionImage ?? record.question_image ?? ""),
    options: (Array.isArray(record.options) ? record.options : []) as AssignmentOption[],
    correctAnswer: Number(record.correctAnswer ?? record.correct_answer ?? 0),
    explanation: String(record.explanation ?? ""),
    marks: Number(record.marks ?? 1),
    difficulty: String(record.difficulty ?? "medium"),
    topic: String(record.topic ?? ""),
    source: { kind: "generated" },
  };
}

export function createCustomQuestion(topic = ""): PackQuestionDraft {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    questionImage: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    marks: 1,
    difficulty: "medium",
    topic,
    source: { kind: "custom" },
  };
}

/** Category breakdown for summary chips: [["Percentage", 5], ...]. */
export function categoryBreakdown(
  questions: Pick<PackQuestionDraft, "topic">[],
): [string, number][] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    const key = q.topic.trim() || "Untagged";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function totalPackMarks(
  questions: Pick<PackQuestionDraft, "marks">[],
): number {
  return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
}

/** How many tests/sets N questions split into, mirroring the backend chunking. */
export function chunkCount(total: number, size: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / Math.max(1, size));
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function minutesToSeconds(minutes: number): number {
  return Math.max(0, Math.round(minutes)) * 60;
}

/** Plain-language summary of what a learner gets in each enabled module. */
export function describeModulePlan(
  info: PackInfoDraft,
  questionCount: number,
): { module: ExamModule; summary: string }[] {
  const plans: { module: ExamModule; summary: string }[] = [];
  for (const module of info.allowed_modules) {
    if (module === "practice") {
      plans.push({
        module,
        summary:
          questionCount === 0
            ? "All questions in one untimed set"
            : `${questionCount} questions in one untimed set`,
      });
      continue;
    }
    const tests = chunkCount(questionCount, info.test_size);
    const perTest =
      questionCount === 0
        ? `${info.test_size} questions`
        : `${Math.min(info.test_size, questionCount)} questions`;
    const unit = tests === 1 ? "section" : "sections";
    const duration = formatDuration(info.test_duration_seconds);
    plans.push({
      module,
      summary: `${tests} timed ${unit} · ${perTest} each · ${duration} each`,
    });
  }
  return plans;
}

export function draftToApi(draft: PackQuestionDraft): Record<string, unknown> {
  return {
    question: draft.question,
    question_image: draft.questionImage,
    options: draft.options,
    correct_answer: draft.correctAnswer,
    explanation: draft.explanation,
    marks: draft.marks,
    difficulty: draft.difficulty,
    topic: draft.topic,
    source: draft.source,
  };
}

export function draftOptionText(option: AssignmentOption): string {
  return optionText(option);
}

export function formatPackPrice(price: string): string {
  const num = Number(price);
  return num === 0 ? "Free" : `₹${num.toLocaleString("en-IN")}`;
}
