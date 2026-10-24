import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CompanyInterviews } from "./company-interviews";
import type { Interview } from "@/lib/types";

afterEach(cleanup);

test("면접 상태에 따라 통과 기업은 상단에 남고 제외 기업은 단계·사유와 하단으로 이동한다", () => {
  const pending: Interview = { job: { id: "one", company: "First", title: "Engineer", country: "US", location: "", salary: "", text: "", source: "test", url: "https://example.com" }, stage: "salary", messages: [{ role: "recruiter", stage: "salary", text: "연봉을 확인합니다" }], matchReasons: [] };
  const passed: Interview = { ...pending, job: { ...pending.job, id: "two", company: "Second" }, result: { outcome: "recommended", reasons: ["역량 일치"] } };
  const view = render(<CompanyInterviews interviews={[pending, passed]} candidates={[]} runId="test" done={false} />);
  expect(within(screen.getByRole("region", { name: "진행 및 통과 기업" })).getAllByRole("article", { name: /면접 카드/ }).map(item => item.getAttribute("aria-label"))).toEqual(["Second 면접 카드", "First 면접 카드"]);
  expect(screen.getByRole("button", { name: "면접 일정 잡기 →" })).toBeDefined();
  const held: Interview = { ...pending, job: { ...pending.job, id: "three", company: "Adjustable" }, result: { outcome: "hold", reasons: ["근무 조건 추가 확인"] } };
  view.rerender(<CompanyInterviews interviews={[{ ...pending, stage: "completed", result: { outcome: "mismatch", reasons: ["필수 조건 불일치"] } }, passed, held]} candidates={[]} runId="test" done />);
  const archive = screen.getByRole("region", { name: "제외 및 보류 기업" });
  expect(within(archive).getByText("연봉 협상 중 단계에서 제외")).toBeDefined();
  expect(within(archive).getAllByRole("article", { name: /면접 카드/ }).map(item => item.getAttribute("aria-label"))).toEqual(["Adjustable 면접 카드", "First 면접 카드"]);
  expect(archive.querySelector(".status-mismatch .company-decision")?.textContent).toContain("필수 조건 불일치");
  expect(within(archive).queryByRole("button")).toBeNull();
});
