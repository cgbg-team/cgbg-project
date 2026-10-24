import { expect, test } from "vitest";
import { onboardingResearch } from "./onboarding-research";

test("온보딩 연봉 질문에 미리 계산한 공고 연봉과 빅맥 가격을 쓴다", () => {
  const us = onboardingResearch("US", "Senior Software Engineer", "ko");
  expect(us?.hasSalary).toBe(true);
  expect(us?.research.summary).toMatch(/공고 기준 연봉\(USD.*중앙값 \$[\d,]+.*빅맥 가격 6\.22 USD.*한국은 US\$3\.84/);
  // 공고 연봉 표본이 없는 나라는 빅맥 가격만 돌려주고 연봉은 웹 검색에 맡긴다.
  const sg = onboardingResearch("SG", "Clinical Lead", "en");
  expect(sg).toMatchObject({ hasSalary: false });
  expect(sg?.research.summary).toContain("Big Mac");
  expect(onboardingResearch("ZZ", "Barista", "en")).toBeNull();
});
