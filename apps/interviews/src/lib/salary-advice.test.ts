import { expect, it } from "vitest";
import { undisclosedSalaryAdvice, withSalaryAdvice } from "./salary-advice";
import type { Job } from "./types";

const job: Job = { id: "test", title: "Software Engineer", company: "Test", country: "US", location: "", salary: "", source: "test", url: "https://example.com", text: "" };

it("미공개 연봉은 희망·시장 기준으로 제안하고 기존 공개 금액과 조언은 보존한다", () => {
  const salary = { target: 150000, currency: "USD" as const, floor: 110000 };
  const advice = withSalaryAdvice(["추천 이유.", "매력.", "연봉을 물어보세요."], job, salary);
  expect(advice.advice).toHaveLength(3);
  expect(advice.advice[2]).toContain("USD 150,000–165,000/년");
  expect(advice.advice[2]).toContain("USD 133,080");
  expect(JSON.stringify(advice)).not.toContain("110000");
  expect(advice.adviceSource?.url).toContain("bls.gov");
  expect(undisclosedSalaryAdvice(job, { target: 100000, currency: "USD" })?.text).toContain("USD 133,080–146,388");
  expect(withSalaryAdvice(["기존 조언."], { ...job, salary: "$100K–$200K" }, salary)).toEqual({ advice: ["기존 조언."] });
});

it("다른 통화는 환산하지 않고 비개발 직무에 개발자 통계를 적용하지 않는다", () => {
  const salary = { target: 150000, currency: "USD" as const };
  const japan = undisclosedSalaryAdvice({ ...job, country: "JP" }, salary);
  expect(japan?.text).toContain("JPY 8,500,000");
  expect(japan?.text).toContain("통화·보상 구성 차이 확인");
  expect(undisclosedSalaryAdvice({ ...job, title: "Barista" }, salary)?.text).toContain("통계 미확보");
  expect(undisclosedSalaryAdvice({ ...job, country: "ZZ" }, salary)?.source).toBeUndefined();
  expect(undisclosedSalaryAdvice(job, { ...salary, target: NaN })).toBeUndefined();
  expect(undisclosedSalaryAdvice({ ...job, country: "UK", title: "ML Engineer" }, salary)?.text).toContain("GBP 70,000");
});
