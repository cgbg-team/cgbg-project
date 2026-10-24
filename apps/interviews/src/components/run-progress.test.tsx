import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { applyEvent, emptySnapshot, type RunEvent } from "@/lib/types";
import { RunProgress } from "./run-progress";

afterEach(cleanup);

test("완료 후에도 검색어와 이전 단계 로그를 보존하고 기업별 발화를 전체 로그에 섞지 않는다", () => {
  const events: RunEvent[] = [
    { type: "stage", stage: "keywords", at: "2026-10-24T05:00:00Z" },
    { type: "keywords", keywords: [{ term: "Python", source: "skills" }], at: "2026-10-24T05:00:01Z" },
    { type: "stage", stage: "screening", at: "2026-10-24T05:00:02Z" },
    { type: "message", jobId: "one", message: { role: "candidate", text: "개별 대화", stage: "salary" }, at: "2026-10-24T05:00:03Z" },
    { type: "done", at: "2026-10-24T05:00:04Z" },
  ];
  const snapshot = events.reduce(applyEvent, emptySnapshot);
  expect(snapshot.progressLogs).toHaveLength(4);
  expect(snapshot.progressLogs[1].text).toBe("Python 검색어로 검색합니다…");
  render(<RunProgress snapshot={snapshot} started demo />);
  expect(screen.getByText(/진행 로그 보기/).closest("summary")).toBeDefined();
  expect(screen.getByRole("list", { name: "과거 진행 로그", hidden: true }).textContent).toContain("Python 검색어로 검색합니다…");
});
