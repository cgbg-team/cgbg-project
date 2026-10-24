// @vitest-environment node
import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { fetchLiveJobs } from "./liveJobs";

const job = (id: string, url: string) => ({ id, title: "Product Manager", company: "Acme", country: "US", location: "Remote · USA", salary: "", source: "jobicy (live)", url, text: "" });

test("Supabase 공유 캐시가 있으면 공개 API를 부르지 않고, 출처 도메인이 아닌 행과 국가 미지정 원격 공고는 버린다", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("job_search_cache") && url.includes("jobicy")) {
      return Response.json([{ jobs: [job("LJ1", "https://jobicy.com/jobs/1"), job("LJ2", "https://evil.example/jobs/2")], fetched_at: new Date().toISOString() }]);
    }
    if (url.includes("job_search_cache")) return new Response(null, { status: 201 });
    return Response.json({ jobs: [{ id: 9, url: "https://remotive.com/9", title: "PM", company_name: "Anyco", candidate_required_location: "Worldwide" }] });
  });
  vi.stubGlobal("fetch", fetchMock);
  try {
    const jobs = await fetchLiveJobs(["cache only pm"], "US");
    expect(jobs.map((j) => j.id)).toEqual(["LJ1"]);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("jobicy.com/api"))).toBe(false);
  } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
});
