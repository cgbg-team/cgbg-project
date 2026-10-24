import { expect, test } from "vitest";
import { createInterviewCalendar, readInterviewSchedules } from "./interview-schedule";

const slot = { startsAt: "2026-10-26T03:30:00Z", endsAt: "2026-10-26T04:30:00Z", timeZone: "Asia/Kolkata" };

test("저장 일정의 날짜·시간대를 검증하고 이전 단일 일정도 읽는다", () => {
  expect(readInterviewSchedules(JSON.stringify(slot))).toEqual([slot]);
  expect(readInterviewSchedules("broken")).toEqual([]);
  expect(readInterviewSchedules(JSON.stringify({ ...slot, timeZone: "unknown" }))).toEqual([]);
  expect(readInterviewSchedules(JSON.stringify({ ...slot, endsAt: slot.startsAt }))).toEqual([]);
});

test("다중 일정의 시각을 보존하고 한국어·줄바꿈을 안전한 iCalendar로 내보낸다", () => {
  const content = createInterviewCalendar("한글기업".repeat(15) + ",Inc;\nBEGIN:VEVENT", "run-1", "job-1", [slot, { ...slot, startsAt: "2026-10-27T03:30:00Z", endsAt: "2026-10-27T04:30:00Z" }], new Date("2026-10-24T00:00:00Z"));
  const unfolded = content.replace(/\r\n /g, "");
  expect(unfolded.match(/^BEGIN:VEVENT$/gm)).toHaveLength(2);
  expect(unfolded).toContain("DTSTART:20261026T033000Z\r\nDTEND:20261026T043000Z");
  expect(unfolded).toContain("DTSTAMP:20261024T000000Z");
  expect(unfolded).toContain("\\,Inc\\;\\nBEGIN:VEVENT 면접");
  expect(content.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75)).toBe(true);
  expect(content.endsWith("END:VCALENDAR\r\n")).toBe(true);
});
