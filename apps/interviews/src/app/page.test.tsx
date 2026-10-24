import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { InterviewDashboard } from "@/components/interview-dashboard";
import candidate from "@/data/demo/candidate/index.json";
import { publicProfileSchema } from "@/lib/schemas";

afterEach(cleanup);

test("기본 화면에 앱 제목을 표시한다", () => {
  render(<InterviewDashboard profile={publicProfileSchema.parse(candidate.publicProfile)} ready={false} />);
  expect(screen.getByRole("heading", { level: 1, name: "에이전트 면접" })).toBeDefined();
  expect(screen.getByRole("button", { name: "면접 시작 ↗" }).hasAttribute("disabled")).toBe(true);
  expect(screen.queryByText("90000")).toBeNull();
});
