import data from "../data/jobs/benchmarks.json";

// scripts/build-benchmarks.mjs가 미리 계산한 값이다. 연봉은 수집 공고 기준 USD 연봉이며 시장 평균이 아니다.
type Salary = { n: number; p25: number; median: number; p75: number };
const roles = data.rules.roles.map(([name, source]) => [name, new RegExp(source)] as const);
const levels = { skip: new RegExp(data.rules.levels.skip), entry: new RegExp(data.rules.levels.entry), senior: new RegExp(data.rules.levels.senior) };
const countries: Record<string, (typeof data.countries)["US"] | undefined> = data.countries;
const salaries: Record<string, Salary | undefined> = data.salaries;

export const benchmarkSources = data.sources;

export function classifyTitle(title: string) {
  const lower = title.toLowerCase();
  const role = roles.find(([, re]) => re.test(lower))?.[0] ?? "";
  const level = levels.skip.test(lower) ? "" : levels.entry.test(lower) ? "entry" : levels.senior.test(lower) ? "senior" : "mid";
  return { role, level };
}

export function countryCost(country: string) {
  return countries[country] ?? null;
}

// 같은 연차 표본이 없으면 그 나라·직무의 다른 연차로 넘어가고, 어떤 연차인지 함께 돌려준다.
export function salaryBenchmark(title: string, country: string) {
  const { role, level } = classifyTitle(title);
  if (!role || !level) return null;
  for (const lv of [level, "mid", "senior", "entry"]) {
    const hit = salaries[`${country}|${role}|${lv}`];
    if (hit) return { role, level: lv, exactLevel: lv === level, currency: "USD", ...hit };
  }
  return null;
}
