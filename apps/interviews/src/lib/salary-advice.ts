import type { PrivateProfile } from "@cgbg/shared/profile";
import type { Job } from "./types";

// shortcut: 국가별 인접 기술 직군 통계다; 직군별 자료가 늘면 세부 직군 기준으로 교체한다.
const markets = {
  US: { currency: "USD", value: 133080, label: "개발자 중앙값", period: "2024년", url: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm" },
  KR: { currency: "KRW", value: 48750000, label: "AI·개발·데이터 평균", period: "2026년 10월", url: "https://www.jobkorea.co.kr/salary/index?jobTypeCode=10031&tabindex=2" },
  JP: { currency: "JPY", value: 8500000, label: "국제 개발자 설문·Software Engineer 총보상 중앙값", period: "2025년", url: "https://2025.surveys.tokyodev.com/en-US/current-job/" },
  GB: { currency: "GBP", value: 70000, label: "ML 엔지니어 공고 중앙값", period: "2026년 10월까지 6개월", url: "https://www.itjobswatch.co.uk/jobs/uk/machine%20learning%20engineer.do" },
  DE: { currency: "EUR", value: 65000, label: "ML 엔지니어 중앙값", period: "2026-10-24 조회", url: "https://germantechjobs.de/en/salaries/Machine-Learning/all/all" },
} as const;

const technicalRole = /software|developer|machine learning|\bML\b|\bAI\b|speech|multimodal|data (?:engineer|scientist)|research engineer|개발|인공지능|머신러닝|데이터|소프트웨어/i;
const money = (value: number, currency: string) => `${currency} ${Math.round(value).toLocaleString("en-US")}`;

export function undisclosedSalaryAdvice(job: Job, salary: Pick<PrivateProfile["salary"], "target" | "currency">) {
  if (job.salary.trim()) return undefined;
  const country = job.country.toUpperCase() === "UK" ? "GB" : job.country.toUpperCase();
  const market = technicalRole.test(job.title) ? markets[country as keyof typeof markets] : undefined;
  const target = salary.target;
  if (!Number.isFinite(target) || target <= 0) return undefined;
  const lower = market?.currency === salary.currency ? Math.max(target, market.value) : target;
  const range = `${money(lower, salary.currency)}–${Math.ceil(lower * 1.1).toLocaleString("en-US")}/년`;
  const reference = market ? `인접 직군 참고: ${market.label} ${money(market.value, market.currency)}/년; ` : "해당 국가·직군 통계 미확보; ";
  return {
    text: `${reference}희망 ${money(target, salary.currency)}/년을 기준으로 ${range}를 협상안으로 제안합니다(상단 10%는 협상 여유, 회사 제시액 아님${market && market.currency !== salary.currency ? ", 통화·보상 구성 차이 확인" : ""}).`,
    source: market ? { label: `${market.period} · ${market.label}`, url: market.url } : undefined,
  };
}

export function withSalaryAdvice(advice: string[], job: Job, salary: Pick<PrivateProfile["salary"], "target" | "currency">) {
  const guidance = undisclosedSalaryAdvice(job, salary);
  return guidance ? { advice: [...advice.slice(0, 2), guidance.text], adviceSource: guidance.source } : { advice };
}
