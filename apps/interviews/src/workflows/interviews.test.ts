import { expect, test, vi } from "vitest";
import type { Job, Message, RunEvent } from "../lib/types";

const state = vi.hoisted(() => {
  const events: Omit<RunEvent, "at">[] = [];
  const lengths: { id: string; count: number; needsUser: boolean }[] = [];
  return { events, lengths, active: 0, peak: 0 };
});
vi.mock("../lib/steps", () => ({
  prepare: async () => ({ candidate: { publicProfile: { candidateId: "test", wants: { roleTypes: ["Engineer"] } } } }),
  extract: async () => ({ keywords: [{ term: "engineer", source: "wants" }] }),
  screen: async () => ({
    selected: Array.from({ length: 100 }, (_, i) => ({ job: { id: String(i), title: "Engineer", company: `Company ${i}`, country: "US", location: "", salary: "", source: "test", url: "https://example.com", text: "Engineer" }, reasons: ["engineer"] })),
    search: { total: 100, countryTotal: 100, matched: 100, companies: 100, country: "US" },
  }),
  publish: async (event: Omit<RunEvent, "at">) => { state.events.push(event); },
  closeEvents: async () => {},
  recruiterTurn: async (_input: unknown, job: Job, messages: Message[]) => {
    if (!messages.length) { state.active++; state.peak = Math.max(state.peak, state.active); }
    return { message: "질문", stage: "conditions", done: job.id === "0" };
  },
  candidateTurn: async (_input: unknown, job: Job) => ({ message: "답변", needsUser: job.id === "2", question: job.id === "2" ? "사용자 확인" : "", done: job.id === "1" }),
  summarize: async (_input: unknown, job: Job, messages: Message[], needsUser: boolean) => {
    state.lengths.push({ id: job.id, count: messages.length, needsUser });
    state.active--;
    return { outcome: "hold", reasons: ["확인 필요"] };
  },
}));
import { interviewWorkflow } from "./interviews";

test("100개 면접이 동시에 진행되고 발화 한도·양측 조기 종료·사용자 확인을 지킨다", async () => {
  await interviewWorkflow(null, "US", 3);
  expect(state.peak).toBe(100);
  expect(state.lengths).toHaveLength(100);
  expect(state.lengths.find(item => item.id === "0")?.count).toBe(1);
  expect(state.lengths.find(item => item.id === "1")?.count).toBe(2);
  expect(state.lengths.find(item => item.id === "2")).toMatchObject({ count: 2, needsUser: true });
  expect(state.lengths.filter(item => Number(item.id) >= 3).every(item => item.count === 3)).toBe(true);
  expect(state.events.filter(event => event.type === "result")).toHaveLength(100);
  expect(state.events.at(-1)?.type).toBe("done");
});
