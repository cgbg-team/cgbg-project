import type { CandidateMatch, Job, Keyword } from "./types";

export function screenJobs(jobs: Job[], keywords: Keyword[], limit = 100, country = "", primaryRoles: string[] = []) {
  const n = Number.isFinite(limit) ? Math.min(100, Math.max(0, Math.floor(limit))) : 100;
  const candidates = country ? jobs.filter((job) => job.country === country) : jobs;
  const roleWords = /\b(?:engineer|developer|researcher|scientist|manager|writer|teacher|barista|translator|interpreter)\b/g;
  const primaryFamilies = new Set(primaryRoles.flatMap(role => role.toLowerCase().match(roleWords) ?? []));
  if (primaryFamilies.has("engineer") || primaryFamilies.has("developer")) {
    for (const family of ["engineer", "developer", "researcher", "scientist"]) primaryFamilies.add(family);
  }
  function rank(track: "primary" | "exploration") {
    const terms = [...new Map(keywords
      .filter(keyword => (keyword.track ?? "primary") === track)
      .filter(keyword => track !== "exploration" || (keyword.basis && keyword.hypothesis))
      .filter(keyword => track !== "exploration" || !(keyword.term.toLowerCase().match(roleWords) ?? []).some(word => primaryFamilies.has(word)))
      .map(keyword => [keyword.term.trim().toLowerCase(), keyword])).entries()].filter(([term]) => term);
    return candidates.map((job) => {
      const title = job.title.toLowerCase();
      const body = job.text.toLowerCase();
      const matches = terms.filter(([term]) => title.includes(term) || (track === "primary" && body.includes(term)));
      const score = matches.reduce((sum, [term]) => sum + (title.includes(term) ? 3 : 0) + (body.includes(term) ? 1 : 0), 0);
      // 회사 복지의 커피·언어 언급을 전환 직업으로 오인하지 않도록 탐색은 제목 일치가 필수다.
      const evidence = matches.find(([,keyword]) => keyword.basis === "evidence")?.[1] ?? matches[0]?.[1];
      const match: CandidateMatch = { job, reasons: matches.map(([term]) => term), track,
        ...(track === "exploration" ? { basis: evidence?.basis, hypothesis: evidence?.hypothesis } : {}),
      };
      return { ...match, score: score ? score + (job.salary ? 1 : 0) : 0 };
    }).filter(item => item.score > 0 && item.job.company.trim() && (track !== "exploration" || !(item.job.title.toLowerCase().match(roleWords) ?? []).some(word => primaryFamilies.has(word)))).sort((a,b) => b.score - a.score);
  }
  const primary = rank("primary");
  const exploration = rank("exploration");
  const companyKey = (job: Job) => job.company.trim().toLowerCase();
  const seen = new Set<string>();
  function take(ranked: typeof primary, count: number): CandidateMatch[] {
    const result: CandidateMatch[] = [];
    for (const item of ranked) {
      if (result.length >= count) break;
      const key = companyKey(item.job);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ job: item.job, reasons: item.reasons, track: item.track, basis: item.basis, hypothesis: item.hypothesis });
    }
    return result;
  }
  const primaryCompanies = new Set(primary.map(item => companyKey(item.job))).size;
  const explorationTarget = Math.min(Math.round(n * 0.1), Math.round(primaryCompanies / 9));
  const interest = take(exploration.filter(item => item.basis === "interest"), Math.min(1, explorationTarget));
  const explored = [...interest, ...take(exploration, explorationTarget - interest.length)];
  const selected = [...take(primary, n - explored.length), ...explored];
  const matched = [...new Set([...primary, ...exploration].map(item => item.job.id))].length;
  const companies = new Set([...primary, ...exploration].map(item => companyKey(item.job))).size;
  // 전체 풀은 검색 step에 남기고 최대 100개 후보만 반환한다. 면접 수 제한은 Workflow가 별도로 적용한다.
  return { selected, excluded: [], search: { total: jobs.length, countryTotal: candidates.length, matched, companies, country, candidateCount: selected.length, explorationCount: explored.length, explorationTarget } };
}
