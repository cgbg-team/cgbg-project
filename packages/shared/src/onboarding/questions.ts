export type Locale = "ko" | "en";

export const questions = {
  direction: ["expertise", "newField", "openToAll"],
  pay: ["keepLevel", "flexibleForGrowth", "altIncome"],
  priority: ["stability", "growth", "balance"],
} as const;

export type QuestionId = keyof typeof questions;
export type Answers = { [K in QuestionId]: (typeof questions)[K][number] };

export const questionIds = Object.keys(questions) as QuestionId[];

export function isAnswer<K extends QuestionId>(
  id: K,
  value: unknown,
): value is Answers[K] {
  return (questions[id] as readonly unknown[]).includes(value);
}
