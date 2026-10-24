import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { InterviewComplete } from "./interview-complete";

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });

test("축하 화면에서 저장한 모든 면접 시간을 캘린더 파일로 내려받는다", async () => {
  localStorage.setItem("cgbg-application:v1:demo:job-a", JSON.stringify([
    { startsAt: "2026-10-26T00:00:00Z", endsAt: "2026-10-26T01:00:00Z", timeZone: "Asia/Seoul" },
    { startsAt: "2026-10-27T00:00:00Z", endsAt: "2026-10-27T01:00:00Z", timeZone: "Asia/Seoul" },
  ]));
  const create = vi.fn().mockReturnValue("blob:calendar");
  URL.createObjectURL = create;
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const view = render(<InterviewComplete runId="demo" jobId="job-a" company="Sample" />);
  expect(await screen.findByRole("heading", { name: /축하해요/ })).toBeDefined();
  expect(screen.getByText("🎉")).toBeDefined();
  expect(screen.getByRole("list", { name: "선택한 면접 일정" }).children).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "캘린더에 추가하기" }));
  expect(create.mock.calls[0][0].type).toBe("text/calendar;charset=utf-8");
  expect(click).toHaveBeenCalledOnce();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:calendar");
  view.unmount();
  localStorage.clear();
  render(<InterviewComplete runId="demo" jobId="missing" company="Sample" />);
  expect(await screen.findByRole("heading", { name: "저장된 면접 일정을 찾지 못했어요." })).toBeDefined();
  expect(screen.queryByRole("button", { name: "캘린더에 추가하기" })).toBeNull();
});
