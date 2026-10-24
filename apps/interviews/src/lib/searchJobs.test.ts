// @vitest-environment node
import { expect, test, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";
vi.mock("server-only", () => ({}));
import { searchJobPool } from "./searchJobs";
import { loadDemoCandidate } from "./fixtures";
import { parseCandidateFiles } from "./candidate-input";
import candidate from "../../../../data/demo/candidates/onboarding-example/index.json";

test("샘플 체험과 온보딩 폴더 업로드는 동일한 최신 프로필과 공개 문서를 사용한다", async () => {
  const root = path.resolve("data/demo/candidates/onboarding-example");
  const files = ["index.json", ...candidate.publicProfile.docs.map(doc => doc.path), ...candidate.privateProfile.docs.map(doc => doc.path)].map(name => ({ path: `example/${name}`, content: readFileSync(path.join(root, name), "utf8") }));
  const uploaded = parseCandidateFiles(files);
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(path.resolve("apps/interviews"));
  try {
    expect(await loadDemoCandidate()).toEqual(uploaded);
    expect(uploaded.publicProfile.headline).toContain("멀티모달 AI");
    expect(uploaded.docs.every(doc => doc.path.startsWith("public/"))).toBe(true);
  } finally { cwd.mockRestore(); }
});

test("실제 압축 풀에서 호주 공고를 검색하고 상위 두 회사만 반환한다", () => {
  vi.stubEnv("JOBS_POOL_PATH", fileURLToPath(new URL("../data/jobs/jobs_pool.json.gz", import.meta.url)));
  try {
    const result = searchJobPool([{ term: "software engineer", source: "wants" }], { country: "AU", n: 2 });
    expect(result.search).toMatchObject({ total: 17237, countryTotal: 172, country: "AU" });
    expect(result.selected.map(({job}) => job.id)).toEqual(["J00558", "J04766"]);
    expect(result.selected.every(({job}) => job.url.startsWith("https://") && typeof job.salary === "string" && typeof job.text === "string")).toBe(true);
    expect(JSON.stringify(result).length).toBeLessThan(15000);
  } finally { vi.unstubAllEnvs(); }
});

test("풀에 제목 일치 공고가 모자라면 실시간 공개 API 공고로 채우고, 실패해도 풀 결과를 쓴다", async () => {
  vi.stubEnv("JOBS_POOL_PATH", fileURLToPath(new URL("../data/jobs/jobs_pool.json.gz", import.meta.url)));
  const jobicy = { jobs: [{ id: 1, url: "https://jobicy.com/jobs/1", jobTitle: "Coffee Community Lead", companyName: "Bean Co", jobGeo: "Australia", jobDescription: "<p>Lead our coffee community</p>", salaryMin: 70000, salaryMax: 90000, salaryCurrency: "AUD" }] };
  const fetchMock = vi.fn(async (url: string) => (url.includes("jobicy") ? new Response(JSON.stringify(jobicy)) : new Response("", { status: 503 })));
  vi.stubGlobal("fetch", fetchMock);
  try {
    const { searchJobsOnDemand } = await import("./searchJobs");
    const result = await searchJobsOnDemand([{ term: "coffee community", source: "wants" }], { country: "AU" });
    expect(result.selected[0].job).toMatchObject({ id: "LJ1", company: "Bean Co", country: "AU", salary: "AUD 70000–90000", text: "Lead our coffee community" });
    expect(result.search.live).toBe(1);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("geo=australia"))).toBe(true);
    const pooled = await searchJobsOnDemand([{ term: "software engineer", source: "wants" }], { country: "AU", n: 2 });
    expect(pooled.search.live).toBe(0);
  } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
});
