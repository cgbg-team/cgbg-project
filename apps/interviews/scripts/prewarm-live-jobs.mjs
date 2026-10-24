// 시연 전에 예상 검색어로 실시간 공고를 받아 Supabase job_search_cache를 채운다. 앱과 같은 liveJobs.ts 코드를 쓴다.
// NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=… node apps/interviews/scripts/prewarm-live-jobs.mjs
import { createRequire } from "node:module";
import path from "node:path";
import { createJiti } from "jiti";

// server-only는 react-server 조건에서만 빈 모듈이라 스크립트에서는 빈 파일로 바꿔 불러온다.
const serverOnly = path.join(path.dirname(createRequire(import.meta.url).resolve("server-only")), "empty.js");
const jiti = createJiti(import.meta.url, { alias: { "server-only": serverOnly } });
const { fetchLiveJobs } = await jiti.import("../src/lib/liveJobs.ts");

// 오늘 심사위원 공개 이력과 소속 투자사 분야에서 뽑은 검색어. 개인 정보는 넣지 않는다.
const plans = [
  [["product manager", "growth", "product owner"], ["", "US", "SG"]],
  [["engineering manager", "voice", "software engineer"], ["", "US", "JP"]],
  [["business operations", "strategy", "business development"], ["", "US", "SG"]],
  [["research scientist", "machine learning", "researcher"], ["", "US", "UK"]],
  [["hardware", "semiconductor", "investment"], ["", "US", "KR"]],
  [["healthcare", "content", "investment"], ["", "US", "KR"]],
];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase 환경변수를 설정하세요.");
for (const [terms, countries] of plans) {
  for (const country of countries) {
    const started = Date.now();
    const jobs = await fetchLiveJobs(terms, country);
    console.log(`${terms.join(", ")} · ${country || "전체"} → ${jobs.length}건 (${Date.now() - started}ms)`);
  }
}
