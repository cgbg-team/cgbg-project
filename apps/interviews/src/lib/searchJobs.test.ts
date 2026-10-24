// @vitest-environment node
import { expect, test, vi } from "vitest";
import { fileURLToPath } from "node:url";
vi.mock("server-only", () => ({}));
import { searchJobPool } from "./searchJobs";

test("실제 압축 풀에서 호주 공고를 검색하고 상위 두 회사만 반환한다", () => {
  vi.stubEnv("JOBS_POOL_PATH", fileURLToPath(new URL("../data/jobs/jobs_pool.json.gz", import.meta.url)));
  try {
    const result = searchJobPool([{ term: "software engineer", source: "wants" }], { country: "AU" });
    expect(result.search).toMatchObject({ total: 17237, countryTotal: 172, country: "AU" });
    expect(result.selected.map(({job}) => job.id)).toEqual(["J00558", "J04766"]);
    expect(result.selected.every(({job}) => job.url?.startsWith("https://") && job.salary === null)).toBe(true);
    expect(JSON.stringify(result).length).toBeLessThan(15000);
  } finally { vi.unstubAllEnvs(); }
});
