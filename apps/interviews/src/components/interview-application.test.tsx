import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { InterviewApplication } from "./interview-application";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

afterEach(() => { navigation.push.mockClear(); cleanup(); localStorage.clear(); vi.useRealTimers(); Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal"); Reflect.deleteProperty(HTMLDialogElement.prototype, "close"); });

test("지난 시간을 거부하고 여러 날짜의 1시간 슬롯을 선택·해제·저장·복원한다", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T03:00:00Z"));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  const props = { runId: "demo", jobId: "job-a", company: "Sample", country: "KR" };
  const view = render(<InterviewApplication {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "면접 신청하기 ↗" }));
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "일정 확정하기" }).disabled).toBe(true);
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "2026-10-25" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "2026-10-26" }));
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "11:00 ~ 12:00" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "13:00 ~ 14:00" }));
  vi.setSystemTime(new Date("2026-10-26T05:00:00Z"));
  fireEvent.click(screen.getByRole("button", { name: "일정 확정하기" }));
  expect(screen.getByRole("alert").textContent).toContain("미래 날짜");
  fireEvent.click(screen.getByRole("button", { name: /선택 해제$/ }));
  fireEvent.click(screen.getByRole("button", { name: "2026-10-27" }));
  fireEvent.click(screen.getByRole("button", { name: "10:00 ~ 11:00" }));
  const toggled = screen.getByRole("button", { name: "11:00 ~ 12:00" });
  fireEvent.click(toggled);
  expect(toggled.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(toggled);
  expect(toggled.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "12:00 ~ 13:00" }));
  fireEvent.click(screen.getByRole("button", { name: "2026-10-28" }));
  fireEvent.click(screen.getByRole("button", { name: "15:00 ~ 16:00" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 확정하기" }));
  expect(screen.getByRole("status").textContent).toContain("선택한 시간 3개");
  expect(navigation.push).toHaveBeenCalledWith("/interview-complete?run=demo&job=job-a&company=Sample");
  const slots = JSON.parse(localStorage.getItem("cgbg-application:v1:demo:job-a") ?? "null");
  expect(slots).toHaveLength(3);
  expect(slots.map((slot: { startsAt: string; endsAt: string }) => new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime())).toEqual([60 * 60_000, 60 * 60_000, 60 * 60_000]);
  view.unmount();
  const restored = render(<InterviewApplication {...props} />);
  expect(screen.getByRole("status").textContent).toContain("선택한 시간 3개");
  fireEvent.click(screen.getByRole("button", { name: "일정 변경하기" }));
  fireEvent.click(screen.getByRole("button", { name: "2026-10-27" }));
  expect(screen.getByRole("button", { name: "10:00 ~ 11:00" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "12:00 ~ 13:00" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "달력 닫기" }));
  restored.rerender(<InterviewApplication {...props} jobId="job-b" />);
  expect(screen.getByRole("button", { name: "면접 신청하기 ↗" })).toBeDefined();
});

test("이전에 저장한 단일 면접 일정도 표시한다", () => {
  localStorage.setItem("cgbg-application:v1:demo:legacy", JSON.stringify({ startsAt: "2026-10-25T10:30:00Z", endsAt: "2026-10-25T11:00:00Z", timeZone: "UTC" }));
  render(<InterviewApplication runId="demo" jobId="legacy" company="Sample" country="KR" />);
  expect(screen.getByRole("status").textContent).toContain("10:30");
  expect(screen.getByRole("button", { name: "일정 변경하기" })).toBeDefined();
});


test("미국 공고는 현지 평일 영업시간 9개만 표시하고 해당 시간대로 저장한다", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-05T01:00:00Z"));
  const { InterviewCalendar } = await import("./interview-calendar");
  const onConfirm = vi.fn();
  render(<InterviewCalendar company="US Company" country="US" timeZone="America/New_York" initialSlots={[]} onConfirm={onConfirm} onClose={() => {}} />);
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "2026-01-04" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "2026-01-05" }));
  expect(screen.queryByRole("button", { name: "08:00 ~ 09:00" })).toBeNull();
  expect(screen.queryByRole("button", { name: "18:00 ~ 19:00" })).toBeNull();
  expect(screen.getAllByRole("button", { name: /^\d{2}:00 ~ \d{2}:00$/ })).toHaveLength(9);
  fireEvent.click(screen.getByRole("button", { name: "09:00 ~ 10:00" }));
  fireEvent.click(screen.getByRole("button", { name: "일정 확정하기" }));
  expect(onConfirm).toHaveBeenCalledWith([{ startsAt: "2026-01-05T14:00:00.000Z", endsAt: "2026-01-05T15:00:00.000Z", timeZone: "America/New_York" }]);
});


test("인도 현지 정각 슬롯을 브라우저 시간대와 무관하게 다시 편집할 수 있다", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T00:00:00Z"));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  localStorage.setItem("cgbg-application:v1:demo:india", JSON.stringify([{ startsAt: "2026-10-26T03:30:00Z", endsAt: "2026-10-26T04:30:00Z", timeZone: "Asia/Kolkata" }]));
  render(<InterviewApplication runId="demo" jobId="india" company="India Company" country="IN" />);
  fireEvent.click(screen.getByRole("button", { name: "일정 변경하기" }));
  fireEvent.click(screen.getByRole("button", { name: "2026-10-26" }));
  expect(screen.getByRole("button", { name: "09:00 ~ 10:00" }).getAttribute("aria-pressed")).toBe("true");
});
