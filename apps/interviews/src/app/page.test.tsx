import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { InterviewDashboard } from "@/components/interview-dashboard";
import candidate from "../../../../data/demo/candidates/onboarding-example/index.json";
import { publicProfileSchema } from "@/lib/schemas";

afterEach(cleanup);

test("첫 화면에서 샘플과 내 페르소나를 선택하고 다시 선택할 수 있다", () => {
  render(<InterviewDashboard profile={publicProfileSchema.parse(candidate.publicProfile)} ready={false} />);
  expect(screen.getByRole("heading", { level: 1, name: "누구의 다음 기회를 찾아볼까요?" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "백지오 페르소나로 체험하기" }));
  expect(screen.getByText("백지오 페르소나로 체험합니다.")).toBeDefined();
  expect(screen.getByRole("heading", { level: 1, name: /백지오.*다음 기회/ })).toBeDefined();
  expect(screen.getByRole("region", { name: "백지오가 원하는 직장" }).textContent).toContain("연봉 5천만원+");
  expect(screen.getByRole("region", { name: "사용자 프로필 요약" }).textContent).toContain("영상, 시각-언어, 음성 AI를 아우르는 연구·머신러닝 엔지니어");
  expect(screen.queryByRole("complementary")).toBeNull();
  expect(screen.queryByRole("region", { name: "면접 현황" })).toBeNull();
  expect(screen.getByRole("button", { name: "면접 시작 ↗" }).hasAttribute("disabled")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "페르소나 다시 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "내 페르소나로 체험하기" }));
  expect(screen.getByRole("heading", { name: "구직자 온보딩" })).toBeDefined();
  expect(screen.getByRole("button", { name: "프로필 만들기" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "면접 시작 ↗" })).toBeNull();
  expect(screen.queryByText("90000")).toBeNull();
});
