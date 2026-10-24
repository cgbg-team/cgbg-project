import "server-only";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { z } from "zod";
import { screenJobs } from "./screening";
import type { Job, Keyword } from "./types";

// 제공된 searchJobs.ts의 제목 3점·본문 1점·연봉 1점 및 기업 중복 제거 규칙을 유지한다.
const rowSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().min(1).max(1000), company: z.string().max(500),
  country: z.string().max(10), location: z.string().max(2000),
  salary: z.string().max(5000), source: z.string().min(1).max(100),
  url: z.url().refine((value) => /^https?:\/\//.test(value)),
  text: z.string().max(3000),
});
let pool: Job[] | undefined;
export function loadPool(): Job[] {
  if (!pool) {
    const file = process.env.JOBS_POOL_PATH || path.join(process.cwd(), "src/data/jobs/jobs_pool.json.gz");
    // 기본 풀은 next.config.ts에서 명시적으로 포함해 동적 경로의 전체 저장소 추적을 막는다.
    const rows = z.array(rowSchema).min(1).max(30_000).parse(JSON.parse(gunzipSync(readFileSync(/* turbopackIgnore: true */ file), { maxOutputLength: 128 * 1024 * 1024 }).toString("utf8")));
    if (new Set(rows.map((job) => job.id)).size !== rows.length) throw new Error("공고 ID가 중복되었습니다.");
    pool = rows.map((job) => ({ id: job.id, title: job.title, company: job.company, country: job.country, location: job.location, source: job.source, url: job.url, description: job.text, salaryText: job.salary, salary: null, remote: null, weeklyHours: null, skills: [] }));
  }
  return pool;
}
export function searchJobPool(keywords: Keyword[], opts: { country?: string; n?: number } = {}) {
  return screenJobs(loadPool(), keywords, opts.n ?? 2, opts.country ?? "");
}
export function searchJobs(tags: string[], opts: { country?: string; n?: number } = {}): Job[] {
  return searchJobPool(tags.map((term) => ({ term, source: "wants" })), opts).selected.map(({ job }) => job);
}
