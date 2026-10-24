import { afterEach, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { candidateContext, recruiterContext } from "./agents";
import { createSession, sessionRun, allowStart } from "./access";
import {
  jobSchema,
  privateProfileSchema,
  publicProfileSchema,
} from "./schemas";
import { screenJobs } from "./screening";
import { applyEvent, emptySnapshot } from "./types";
import candidate from "../data/demo/candidate/index.json";
import orbit from "../data/demo/jobs/orbit/index.json";
import relay from "../data/demo/jobs/relay/index.json";
import folio from "../data/demo/jobs/folio/index.json";

afterEach(() => vi.unstubAllEnvs());
const profile = publicProfileSchema.parse(candidate.publicProfile);
const privateProfile = privateProfileSchema.parse(candidate.privateProfile);
const jobs = [orbit, relay, folio].map((job) => jobSchema.parse(job));

test("프로필 v1을 검증하고 잘못된 공개 경로·연봉·근거를 거부한다", () => {
  expect(profile.schemaVersion).toBe(1);
  expect(
    publicProfileSchema.safeParse({
      ...profile,
      docs: [{ path: "private/notes.md", about: "비밀", visibility: "public" }],
    }).success,
  ).toBe(false);
  expect(
    privateProfileSchema.safeParse({
      ...privateProfile,
      salary: { ...privateProfile.salary, floor: 999999 },
    }).success,
  ).toBe(false);
  expect(
    publicProfileSchema.safeParse({
      ...profile,
      skills: [{ name: "SQL", verified: true, evidence: [] }],
    }).success,
  ).toBe(false);
});
test("비공개 하한은 양측 프롬프트에서 제외하고 채용자에게 공개 요약만 전달한다", () => {
  const seeker = candidateContext(profile, privateProfile);
  const recruiter = recruiterContext(profile, [], jobs[0]);
  expect(JSON.stringify(seeker)).not.toContain(
    String(privateProfile.salary.floor),
  );
  expect(JSON.stringify(recruiter)).not.toContain(
    String(privateProfile.salary.target),
  );
  expect(recruiter).not.toHaveProperty("preferences");
  expect(recruiter).not.toHaveProperty("profile");
});
test("실제 검색어 일치 수로 상위 2개만 선택하고 무관한 공고는 제외한다", () => {
  const result = screenJobs(jobs, [
    { term: "Python", source: "skills" },
    { term: "SQL", source: "skills" },
  ]);
  expect(result.selected.map(({ job }) => job.id)).toEqual(["orbit", "relay"]);
  expect(result.excluded.map(({ job }) => job.id)).toContain("folio");
  expect(
    screenJobs(jobs, [{ term: "no-match", source: "wants" }]).selected,
  ).toEqual([]);
});
test("기업별 대화·오류·확인 질문을 섞지 않고 기록을 복원한다", () => {
  let state = applyEvent(emptySnapshot, {
    type: "screened",
    at: "now",
    selected: jobs.slice(0, 2).map((job) => ({ job, reasons: ["SQL"] })),
  });
  state = applyEvent(state, {
    type: "message",
    at: "now",
    jobId: "orbit",
    message: { role: "recruiter", text: "질문", stage: "salary" },
  });
  state = applyEvent(state, {
    type: "question",
    at: "now",
    jobId: "orbit",
    question: "확인 필요",
  });
  state = applyEvent(state, {
    type: "error",
    at: "now",
    jobId: "relay",
    stage: "error",
    error: "실패",
  });
  state = applyEvent(state, { type: "done", at: "now" });
  expect(state.interviews[0].messages).toHaveLength(1);
  expect(state.interviews[1].messages).toHaveLength(0);
  expect(state.interviews[0].question).toBe("확인 필요");
  expect(state.interviews[1].stage).toBe("error");
  expect(state.done).toBe(true);
});
test("서명·만료·실행 ID를 검증하고 시작 횟수를 제한한다", () => {
  vi.stubEnv("INTERVIEW_SESSION_SECRET", "x".repeat(32));
  const token = createSession("wrun_demo", 1000);
  expect(sessionRun(token, 2000)).toBe("wrun_demo");
  expect(sessionRun(token.replace("demo", "other"), 2000)).toBeUndefined();
  expect(sessionRun(token, 86_402_000)).toBeUndefined();
  expect(allowStart("test", 1000)).toBe(true);
  expect(allowStart("test", 2000)).toBe(false);
  expect(allowStart("test", 62000)).toBe(true);
});
