import { z } from "zod";

// 동적 온보딩 질문과 응답 기록. 화면이 들고 다니며 매 요청에 함께 보낸다.
export const questionTypes = ["single", "multi", "text", "number"] as const;

export const plannedQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  why: z.string(),
  type: z.enum(questionTypes),
  options: z.array(z.string()),
  unit: z.string().nullable(),
  fills: z.enum([
    "roleIdeas",
    "transferable",
    "interests",
    "global",
    "salaryTarget",
    "salaryFloor",
    "location",
    "workStyle",
    "dealbreakers",
    "other",
  ]),
});

export const planSchema = z.object({
  done: z.boolean(),
  // 특정 국가·직무의 연봉을 질문하기 전에 실제 시세를 검색해야 할 때만 채운다.
  salaryResearch: z.object({ country: z.string(), role: z.string() }).nullable(),
  questions: z.array(plannedQuestionSchema),
});

export type Source = { title: string; url: string };
export type Question = z.infer<typeof plannedQuestionSchema> & { context?: string; sources?: Source[] };
export type Research = { country: string; role: string; summary: string; sources: Source[] };
export type Answer = string | string[];

const answer = z.union([z.string().max(2_000), z.array(z.string().max(500)).max(20)]);
const source = z.object({ title: z.string().max(500), url: z.string().url().max(2_000) });

export const stepRequestSchema = z.object({
  locale: z.enum(["ko", "en"]),
  agentExport: z.string().min(1).max(100_000),
  rounds: z
    .array(
      z.object({
        questions: z
          .array(plannedQuestionSchema.extend({ context: z.string().max(4_000).optional(), sources: z.array(source).optional() }))
          .max(10),
        answers: z.record(z.string(), answer),
      }),
    )
    .max(5),
  research: z
    .array(z.object({ country: z.string(), role: z.string(), summary: z.string().max(4_000), sources: z.array(source).max(10) }))
    .max(5),
});

export type StepRequest = z.infer<typeof stepRequestSchema>;
export type Round = StepRequest["rounds"][number];

export const maxRounds = 3;

export function formatAnswer(value: Answer | undefined) {
  if (value == null || (Array.isArray(value) && !value.length) || value === "") return "(no answer)";
  return Array.isArray(value) ? value.join(", ") : value;
}

// 선택형 질문 아래의 자유 입력은 `${id}${noteSuffix}` 키로 저장한다.
export const noteSuffix = "__note";

function answerWithNote(round: Round, id: string) {
  const note = round.answers[`${id}${noteSuffix}`];
  const text = formatAnswer(round.answers[id]);
  return typeof note === "string" && note.trim() ? `${text} (note: ${note.trim()})` : text;
}

export function transcript(rounds: Round[]) {
  return rounds
    .map((round, index) =>
      [
        `Round ${index + 1}`,
        ...round.questions.map((q) => `- Q (${q.fills}${q.unit ? `, unit ${q.unit}` : ""}): ${q.text}\n  A: ${answerWithNote(round, q.id)}`),
      ].join("\n"),
    )
    .join("\n\n");
}

export function interviewMarkdown(rounds: Round[]) {
  const body = rounds
    .flatMap((round) => round.questions.map((q) => `## ${q.text}\n\n${answerWithNote(round, q.id)}`))
    .join("\n\n");
  return `# 온보딩 질문 응답\n\n${body}\n`;
}
