import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { InterviewApplication } from "./interview-application";

afterEach(() => { cleanup(); localStorage.clear(); });

test("시연 신청 상태를 기업·실행별로 저장하고 다시 표시한다", () => {
  const props = { runId: "demo", jobId: "job-a", company: "Sample" };
  const view = render(<InterviewApplication {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "면접 신청하기 ↗" }));
  expect(screen.getByRole("status").textContent).toContain("신청 완료");
  view.unmount();
  const restored = render(<InterviewApplication {...props} />);
  expect(screen.getByRole("status").textContent).toContain("신청 완료");
  restored.rerender(<InterviewApplication {...props} jobId="job-b" />);
  expect(screen.getByRole("button", { name: "면접 신청하기 ↗" })).toBeDefined();
});
