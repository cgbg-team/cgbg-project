import type { ResearchLookup } from "@cgbg/shared/onboarding/step";
import { countryCost, salaryBenchmark } from "./benchmarks";

const bigMacSource = { title: "The Economist Big Mac index", url: "https://github.com/TheEconomist/big-mac-data" };
const usd = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

// 온보딩 연봉·빅맥 질문에 미리 계산한 참고값(benchmarks.json)을 쓴다. 연봉은 공고 풀 기준이라 시장 평균이 아니다.
export const onboardingResearch: ResearchLookup = (country, role, locale) => {
  const cost = countryCost(country);
  const korea = countryCost("KR");
  const salary = salaryBenchmark(role, country);
  if (!cost && !salary) return null;
  const ko = locale === "ko";
  const parts: string[] = [];
  if (salary)
    parts.push(
      ko
        ? `공고 기준 연봉(USD, 표본 ${salary.n}건${salary.exactLevel ? "" : ", 비슷한 연차"}): 하위 25% ${usd(salary.p25)} · 중앙값 ${usd(salary.median)} · 상위 25% ${usd(salary.p75)}.`
        : `Posted salaries (USD, ${salary.n} postings${salary.exactLevel ? "" : ", nearby level"}): p25 ${usd(salary.p25)} · median ${usd(salary.median)} · p75 ${usd(salary.p75)}.`,
    );
  if (cost)
    parts.push(
      ko
        ? `빅맥 가격 ${cost.bigMacLocal.toLocaleString("en-US")} ${cost.currency} (US$${cost.bigMacUsd.toFixed(2)})${korea && country !== "KR" ? `, 한국은 US$${korea.bigMacUsd.toFixed(2)}` : ""}.`
        : `Big Mac ${cost.bigMacLocal.toLocaleString("en-US")} ${cost.currency} (US$${cost.bigMacUsd.toFixed(2)})${korea && country !== "KR" ? `, Korea US$${korea.bigMacUsd.toFixed(2)}` : ""}.`,
    );
  return {
    hasSalary: !!salary,
    research: { country, role, summary: parts.join(" "), sources: cost ? [bigMacSource] : [] },
  };
};
