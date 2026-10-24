import type { Job, Keyword } from "./types";

export function screenJobs(jobs: Job[], keywords: Keyword[], limit = 2, country = "") {
  const n = Number.isFinite(limit) ? Math.min(2, Math.max(0, Math.floor(limit))) : 2;
  const terms = [...new Set(keywords.map((keyword) => keyword.term.trim().toLowerCase()).filter(Boolean))];
  const candidates = country ? jobs.filter((job) => job.country === country) : jobs;
  const scored = candidates
    .map((job) => {
      const title = job.title.toLowerCase();
      const body = job.description.toLowerCase();
      const reasons = terms.filter((term) => title.includes(term) || body.includes(term));
      const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 3 : 0) + (body.includes(term) ? 1 : 0), 0);
      return { job, reasons, score: score ? score + (job.salaryText || job.salary ? 1 : 0) : 0 };
    })
    .filter((item) => item.score > 0 && item.job.company.trim().length > 0)
    .sort(
      (a, b) =>
        b.score - a.score,
    );
  const seen = new Set<string>();
  const distinct = scored.filter(({ job }) => {
    const company = job.company.trim().toLowerCase();
    if (seen.has(company)) return false;
    seen.add(company);
    return true;
  });
  const selected = distinct.slice(0, n).map(({ job, reasons }) => ({ job, reasons }));
  // 전체 공고와 미선정 목록을 Workflow에 직렬화하지 않는다.
  return { selected, excluded: [], search: { total: jobs.length, countryTotal: candidates.length, matched: scored.length, companies: distinct.length, country } };
}
