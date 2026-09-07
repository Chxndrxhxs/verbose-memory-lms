import type { SharedQuizQ } from "@masterlms/shared";

export function normalizeText(value: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function quizCorrect(
  q: SharedQuizQ,
  answer: number | string | undefined
): boolean {
  if (q.type === "qa") {
    return typeof answer === "string" && normalizeText(answer) === normalizeText(q.answer ?? "");
  }
  return typeof answer === "number" && answer === q.correct;
}