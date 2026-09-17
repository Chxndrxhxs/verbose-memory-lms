import type {
  AssignmentQuestion,
  QuestionDifficulty,
} from "../types/assignment";
import { createEmptyQuestion } from "../types/assignment";

type GeneratorOptions = {
  count: number;
  difficulty: QuestionDifficulty;
  marksPerQuestion: number;
  numberOfOptions: number;
  generateExplanations: boolean;
  topicDistribution: Record<string, number>;
};

const OPTION_STRUCTURE: Record<
  QuestionDifficulty,
  { stems: string[]; template: (topic: string, i: number) => string }
> = {
  easy: {
    stems: ["What is", "Which of the following defines", "Identify the concept of"],
    template: (topic) => `What is a key characteristic of "${topic}"?`,
  },
  medium: {
    stems: ["Which statement best explains", "What is the primary purpose of", "How does"],
    template: (topic) => `Which statement accurately describes "${topic}"?`,
  },
  hard: {
    stems: ["Analyze how", "Evaluate the significance of", "In which scenario would"],
    template: (topic) => `In the document, which claim about "${topic}" is best supported?`,
  },
};

const TOPIC_POOL = [
  "Overview & Introduction",
  "Core Concepts",
  "Methodology",
  "Case Studies",
  "Key Terms",
  "Applications",
  "Summary & Conclusions",
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
];

const EXPLANATION_POOL = [
  "This is supported by the key definitions and examples presented in the source document.",
  "The document explicitly states this in the relevant section.",
  "This follows directly from the concepts introduced earlier in the material.",
  "The source material discusses this point in context of the main argument.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildOptions(_topic: string, count: number, correct: string): string[] {
  const distractors = [
    "A competing interpretation of the material",
    "An unrelated conclusion not supported by the document",
    "A common misconception addressed in the text",
    "An opposite reading of the source content",
  ];
  const picked = [...distractors.slice(0, Math.max(0, count - 1))];
  while (picked.length < count - 1) {
    picked.push(`Alternative interpretation ${picked.length + 1}`);
  }
  const shuffled = [...picked].sort(() => Math.random() - 0.5);
  const insertAt = Math.floor(Math.random() * count);
  const options = [...shuffled];
  options.splice(insertAt, 0, correct);
  return options.slice(0, count);
}

export function generateSampleQuestions(options: GeneratorOptions): AssignmentQuestion[] {
  const topics = Object.keys(options.topicDistribution).filter(
    (t) => options.topicDistribution[t] > 0
  );
  const fallbackTopics = topics.length > 0 ? topics : TOPIC_POOL;
  const counts: string[] = [];

  if (topics.length > 0) {
    for (const topic of topics) {
      const n = options.topicDistribution[topic];
      for (let i = 0; i < n; i++) counts.push(topic);
    }
  } else {
    for (let i = 0; i < options.count; i++) {
      counts.push(pick(fallbackTopics));
    }
  }

  const questions: AssignmentQuestion[] = [];
  for (let i = 0; i < options.count; i++) {
    const topic = counts[i] ?? pick(fallbackTopics);
    const q = createEmptyQuestion(options.marksPerQuestion);
    const difficulty = options.difficulty;
    const correct = `The document's explanation of ${topic} as presented in the source material.`;
    const optionsList = buildOptions(topic, options.numberOfOptions, correct);

    q.question = pick(OPTION_STRUCTURE[difficulty].stems) + ` "${topic}"?`;
    q.options = optionsList;
    q.correctAnswer = optionsList.indexOf(correct);
    q.explanation = options.generateExplanations
      ? `${pick(EXPLANATION_POOL)} Answer refers to: ${topic}.`
      : "";
    q.difficulty = difficulty;
    q.topic = topic;
    questions.push(q);
  }

  return questions;
}

export function topicsFromPdf(fileName: string): Record<string, number> {
  const base = pick(TOPIC_POOL);
  const detected = new Set<string>([base]);
  if (fileName.includes("chapter")) {
    detected.add("Chapter 1");
    detected.add("Chapter 2");
  }
  const result: Record<string, number> = {};
  for (const t of detected) result[t] = 0;
  return result;
}