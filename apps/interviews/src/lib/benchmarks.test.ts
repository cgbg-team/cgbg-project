import { expect, test } from "vitest";
import { countryCost, salaryBenchmark } from "./benchmarks";

test("공고 제목과 국가로 미리 계산한 빅맥 가격과 공고 연봉 범위를 찾는다", () => {
  expect(countryCost("JP")).toMatchObject({ currency: "JPY", bigMacLocal: 500 });
  expect(countryCost("?")).toBeNull();
  const swe = salaryBenchmark("Senior Software Engineer, Backend", "US");
  expect(swe).toMatchObject({ role: "software_engineer", level: "senior", exactLevel: true, currency: "USD" });
  expect(swe!.p25).toBeLessThanOrEqual(swe!.median);
  expect(salaryBenchmark("Software Engineer Intern", "US")).toBeNull();
  expect(salaryBenchmark("Barista", "AU")).toBeNull();
});
