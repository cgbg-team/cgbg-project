import type { Job, Keyword } from "./types";

export function screenJobs(jobs: Job[], keywords: Keyword[], limit = 2) {
  const scored = jobs
    .map((job) => {
      const corpus =
        `${job.title} ${job.description} ${job.skills.join(" ")}`.toLocaleLowerCase();
      const reasons = [
        ...new Set(keywords.map((keyword) => keyword.term.toLocaleLowerCase())),
      ].filter((term) => corpus.includes(term));
      return { job, reasons };
    })
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length || a.job.id.localeCompare(b.job.id),
    );
  const selected = scored
    .filter((item) => item.reasons.length > 0)
    .slice(0, limit);
  const selectedIds = new Set(selected.map((item) => item.job.id));
  const excluded = scored
    .filter((item) => !selectedIds.has(item.job.id))
    .map(({ job, reasons }) => ({
      job,
      reason: reasons.length
        ? "이번 실행의 공고 수 한도에 따라 제외했습니다."
        : "추출한 검색 키워드와 일치하는 직무 근거가 없습니다.",
    }));
  return { selected, excluded };
}
