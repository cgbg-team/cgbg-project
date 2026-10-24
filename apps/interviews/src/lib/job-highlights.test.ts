import { expect, test } from "vitest";
import { jobHighlights } from "./job-highlights";
import type { Job } from "./types";

test("공고에 명시한 혜택만 태그로 만들고 지원 불가·미기재를 구분한다", () => {
  const job: Job = { id: "one", company: "Example", title: "Engineer", country: "US", location: "Remote - United States", salary: "$150K + Offers Equity", source: "test", url: "https://example.com", text: "Visa sponsorship available. Housing allowance provided. Relocation assistance included." };
  expect(jobHighlights(job).map(tag => tag.label)).toEqual(["비자 지원", "주거비 지원", "이주 지원", "지분 보상", "원격 근무"]);
  expect(jobHighlights({ ...job, salary: "", location: "San Francisco", text: "We do not offer visa sponsorship. No housing allowance. Relocation assistance is not provided." })).toEqual([]);
  expect(jobHighlights({ ...job, text: "", salary: "", location: "" })).toEqual([]);
  expect(jobHighlights({ ...job, text: "", location: "Hybrid" }).map(tag => tag.label)).toEqual(["지분 보상", "하이브리드", "연봉 공개"]);
});
