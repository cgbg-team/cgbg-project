import { afterEach, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { candidateContext, recruiterContext } from "./agents";
import { createSession, sessionRun, allowStart } from "./access";
import {
  jobSchema,
  privateProfileSchema,
  publicProfileSchema,
  candidateSchema,
  recruiterSchema,
  adviceSchema,
} from "./schemas";
import { screenJobs } from "./screening";
import { assessConditions } from "./job-conditions";
import { enrichSearchKeywords } from "./search-keywords";
import { normalizeAdvice } from "./job-advice";
import { applyEvent, emptySnapshot, type Keyword } from "./types";
import candidate from "../../../../data/demo/candidates/onboarding-example/index.json";

afterEach(() => vi.unstubAllEnvs());
const profile = publicProfileSchema.parse(candidate.publicProfile);
const privateProfile = privateProfileSchema.parse(candidate.privateProfile);
const jobs = [
  { id: "orbit", company: "Search A", title: "Python SQL Engineer", text: "Python SQL", salary: "$100,000" },
  { id: "relay", company: "Search B", title: "Engineer", text: "Python SQL", salary: "" },
  { id: "folio", company: "Search C", title: "iOS Engineer", text: "Swift", salary: "" },
].map((job) => jobSchema.parse({ country: "US", location: "", source: "test", url: "https://example.com/job", ...job }));

test("모델이 종료 필드를 생략하면 완료로 오인하지 않고 한도 안에서 대화를 계속한다", () => {
  expect(candidateSchema.parse({ message: "답변", needsUser: false })).toMatchObject({ done: false, question: "" });
  expect(recruiterSchema.parse({ message: "추가 질문", stage: "experience" }).done).toBe(false);
  expect(adviceSchema.safeParse({ advice: ["이유.", "매력.", "협상.", "추가."] }).success).toBe(false);
  const advice = normalizeAdvice(["경험이 맞습니다. 추가 확인이 필요합니다.", "지원이 매력적입니다.", "$175K–$200K를 제안하세요. 지급 주기는 확인하세요."]);
  expect([...new Intl.Segmenter("ko", { granularity: "sentence" }).segment(advice.join(" "))]).toHaveLength(3);
  expect(advice.join(" ")).toContain("지급 주기는 확인하세요");
});

test("명시된 기술·활동·관심사로 검색 표현을 보완하고 관심사를 경력으로 만들지 않는다", () => {
  const keywords = enrichSearchKeywords(profile, []);
  expect(keywords.find(item => item.term === "Python")).toMatchObject({ track: "primary", source: "skills" });
  expect(keywords.find(item => item.term === "barista")).toMatchObject({ track: "exploration", basis: "interest" });
  expect(keywords.find(item => item.term === "community manager")).toMatchObject({ basis: "evidence" });
  expect(enrichSearchKeywords({ ...profile, skills: [], transferableStrengths: [], wants: { ...profile.wants, interests: [] } }, [])).toEqual([]);
});

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
  const offer = recruiterContext(profile, [], { ...jobs[0], text: "Relocation assistance provided. We do not offer visa sponsorship." });
  expect(offer.advertisedBenefits).toContainEqual({ label: "이주 지원", evidence: "Relocation assistance provided" });
  expect(offer.advertisedBenefits.some(benefit => benefit.label === "비자 지원")).toBe(false);
});
test("실제 검색어 일치 수로 상위 2개만 선택하고 무관한 공고는 제외한다", () => {
  const result = screenJobs(jobs, [
    { term: "Python", source: "skills" },
    { term: "SQL", source: "skills" },
  ]);
  expect(result.selected.map(({ job }) => job.id)).toEqual(["orbit", "relay"]);
  expect(result.search).toMatchObject({ total: 3, matched: 2, companies: 2 });
  expect(
    screenJobs(jobs, [{ term: "no-match", source: "wants" }]).selected,
  ).toEqual([]);
});
test("기업 중복·국가·제목 가중치와 면접 수 제한을 적용한다", () => {
  const base = jobs[0];
  const pool = [
    { ...base, id: "body", company: "same", country: "AU", title: "Other", text: "Python" },
    { ...base, id: "title", company: "SAME", country: "AU", title: "Python", text: "" },
    { ...base, id: "us", company: "US", country: "US", title: "Python" },
  ];
  const keywords = [{ term: "Python", source: "skills" as const }];
  expect(screenJobs(pool, keywords, 20, "AU").selected.map(({job}) => job.id)).toEqual(["title"]);
  expect(screenJobs(pool, keywords, 0).selected).toEqual([]);
});
test("후보 100곳을 90:10으로 구성하고 관심사 기반 가설을 보존한다", () => {
  const base = jobs[0];
  const pool = [
    ...Array.from({ length: 110 }, (_, i) => ({ ...base, id: `main-${i}`, company: `Main ${i}`, title: "Python Engineer", country: "US" })),
    ...Array.from({ length: 20 }, (_, i) => ({ ...base, id: `explore-${i}`, company: `Explore ${i}`, title: "Barista", text: "Coffee", country: "US" })),
    { ...base, id: "perk", company: "Perk", title: "Office Manager", text: "We have a barista and coffee", country: "US" },
    { ...base, id: "foreign", company: "Foreign", title: "Barista", country: "KR" },
  ];
  const keywords: Keyword[] = [
    { term: "Python", source: "skills" },
    { term: "barista", source: "wants", track: "exploration", basis: "interest", hypothesis: "커피 관심사에 기반한 가설" },
  ];
  const result = screenJobs(pool, keywords, 200, "US");
  expect(result.selected).toHaveLength(100);
  expect(result.search).toMatchObject({ candidateCount: 100, explorationCount: 10, explorationTarget: 10 });
  expect(result.selected.filter(item => item.basis === "interest")).toHaveLength(10);
  expect(new Set(result.selected.map(item => item.job.company)).size).toBe(100);
  expect(result.selected.some(item => ["perk", "foreign"].includes(item.job.id))).toBe(false);
  expect(screenJobs(pool, [{ term: "Python", source: "skills" }], 100, "US").selected).toHaveLength(100);
  const developerExploration: Keyword = { term: "engineer", source: "transferableStrengths", track: "exploration", basis: "evidence", hypothesis: "같은 개발 직군" };
  expect(screenJobs(pool, [...keywords, developerExploration], 100, "US", ["ML Engineer"]).selected.filter(item => item.track === "exploration").every(item => item.job.title === "Barista")).toBe(true);
});
test("미확인 조건은 별도로 표시하고 AI 사전검토 결과를 보존한다", () => {
  const result = { outcome: "recommended" as const, reasons: ["경험 일치"] };
  expect(assessConditions(result, { ...jobs[0], salary: "" }, false).outcome).toBe("recommended");
  expect(assessConditions(result, jobs[0], true).reasons.join(" ")).toContain("추가 답변");
  expect(assessConditions({ outcome: "mismatch", reasons: ["경험 불일치"] }, jobs[0], false).outcome).toBe("mismatch");
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
