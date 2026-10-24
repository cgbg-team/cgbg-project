import "server-only";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { z } from "zod";
import { fetchLiveJobs } from "./liveJobs";
import { screenJobs } from "./screening";
import { jobSchema } from "./schemas";
import type { Job, Keyword } from "./types";

// 제공된 searchJobs.ts의 제목 3점·본문 1점·연봉 1점 및 기업 중복 제거 규칙을 유지한다.
let pool: Job[] | undefined;
export function loadPool(): Job[] {
  if (!pool) {
    const file = process.env.JOBS_POOL_PATH || path.join(process.cwd(), "src/data/jobs/jobs_pool.json.gz");
    // 기본 풀은 next.config.ts에서 명시적으로 포함해 동적 경로의 전체 저장소 추적을 막는다.
    const rows = z.array(jobSchema).min(1).max(30_000).parse(JSON.parse(gunzipSync(readFileSync(/* turbopackIgnore: true */ file), { maxOutputLength: 128 * 1024 * 1024 }).toString("utf8")));
    if (new Set(rows.map((job) => job.id)).size !== rows.length) throw new Error("공고 ID가 중복되었습니다.");
    pool = rows;
  }
  return pool;
}
export function searchJobPool(keywords: Keyword[], opts: { country?: string; n?: number } = {}) {
  return screenJobs(loadPool(), keywords, opts.n ?? 2, opts.country ?? "");
}
export function searchJobs(tags: string[], opts: { country?: string; n?: number } = {}): Job[] {
  return searchJobPool(tags.map((term) => ({ term, source: "wants" })), opts).selected.map(({ job }) => job);
}

// 풀에서 제목까지 맞는 공고가 모자랄 때만 실시간 공개 API를 불러 채운다. 실시간 호출이 실패해도 풀 결과는 그대로 쓴다.
export async function searchJobsOnDemand(keywords: Keyword[], opts: { country?: string; n?: number } = {}) {
  const n = Math.min(2, Math.max(0, opts.n ?? 2));
  const country = opts.country ?? "";
  const pooled = searchJobPool(keywords, { country, n });
  const terms = keywords.map((keyword) => keyword.term.trim().toLowerCase()).filter(Boolean);
  const strong = pooled.selected.filter(({ job }) => terms.some((term) => job.title.toLowerCase().includes(term)));
  if (strong.length >= n) return { ...pooled, search: { ...pooled.search, live: 0 } };
  const live = await fetchLiveJobs(terms, country);
  const fromLive = screenJobs(live, keywords, n, country).selected.filter(({ job }) => terms.some((term) => job.title.toLowerCase().includes(term)));
  const companies = new Set<string>();
  const selected = [...strong, ...fromLive, ...pooled.selected]
    .filter(({ job }) => !companies.has(job.company.trim().toLowerCase()) && Boolean(companies.add(job.company.trim().toLowerCase())))
    .slice(0, n);
  return { ...pooled, selected, search: { ...pooled.search, live: live.length } };
}
