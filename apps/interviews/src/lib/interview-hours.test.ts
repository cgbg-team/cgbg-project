import { expect, test } from "vitest";
import { businessStart, companyDate, companyTimeZone, isBusinessSlot } from "./interview-hours";

test("공고 국가와 지역으로 채용사 시간대를 정하고 미상 국가는 추정하지 않는다", () => {
  expect(companyTimeZone("US", "San Francisco, CA")).toBe("America/Los_Angeles");
  expect(companyTimeZone("US", "New York")).toBe("America/New_York");
  expect(companyTimeZone("KR")).toBe("Asia/Seoul");
  expect(companyTimeZone("?")).toBeUndefined();
});

test("현지 영업시간을 서머타임과 30분 시차를 반영해 UTC로 저장한다", () => {
  expect(businessStart("2026-01-05", 9, "America/New_York").toISOString()).toBe("2026-01-05T14:00:00.000Z");
  expect(businessStart("2026-07-06", 9, "America/New_York").toISOString()).toBe("2026-07-06T13:00:00.000Z");
  expect(businessStart("2026-01-05", 9, "Asia/Kolkata").toISOString()).toBe("2026-01-05T03:30:00.000Z");
  expect(companyDate(new Date("2026-01-05T01:00:00Z"), "America/New_York")).toBe("2026-01-04");
});

test("채용사 현지의 주말과 영업시간 밖 슬롯은 허용하지 않는다", () => {
  const slot = (date: string, hour: number) => {
    const start = businessStart(date, hour, "Asia/Seoul");
    return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 60 * 60_000).toISOString() };
  };
  expect(isBusinessSlot(slot("2026-10-26", 9), "Asia/Seoul")).toBe(true);
  expect(isBusinessSlot(slot("2026-10-26", 17), "Asia/Seoul")).toBe(true);
  expect(isBusinessSlot(slot("2026-10-26", 18), "Asia/Seoul")).toBe(false);
  expect(isBusinessSlot(slot("2026-10-24", 10), "Asia/Seoul")).toBe(false);
});
