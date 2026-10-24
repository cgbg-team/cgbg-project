const zones: Record<string, string> = {
  US: "America/New_York", UK: "Europe/London", GB: "Europe/London",
  KR: "Asia/Seoul", CA: "America/Toronto", DE: "Europe/Berlin",
  IN: "Asia/Kolkata", IE: "Europe/Dublin", FR: "Europe/Paris",
  SG: "Asia/Singapore", JP: "Asia/Tokyo", AU: "Australia/Sydney", NL: "Europe/Amsterdam",
};
const regions: Record<string, [RegExp, string][]> = {
  US: [[/san francisco|los angeles|seattle|san diego|california|\b(?:CA|WA|OR)\b/i, "America/Los_Angeles"], [/chicago|austin|dallas|houston|texas|\b(?:TX|IL)\b/i, "America/Chicago"], [/denver|colorado|\bCO\b/i, "America/Denver"], [/phoenix|arizona|\bAZ\b/i, "America/Phoenix"]],
  CA: [[/vancouver|british columbia|\bBC\b/i, "America/Vancouver"], [/calgary|edmonton|alberta/i, "America/Edmonton"]],
  AU: [[/perth|western australia/i, "Australia/Perth"], [/brisbane|queensland/i, "Australia/Brisbane"], [/adelaide|south australia/i, "Australia/Adelaide"]],
};
export function companyTimeZone(country: string, location = "") {
  // shortcut: 지역이 불명확하면 국가 대표 시간대를 사용하며, 실제 기업 일정 연동 시 담당자 시간대로 대체한다.
  return regions[country]?.find(([pattern]) => pattern.test(location))?.[1] ?? zones[country];
}
function parts(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const number = (type: Intl.DateTimeFormatPartTypes) => Number(values.find(part => part.type === type)?.value);
  return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute") };
}
export function companyDate(date: Date, timeZone: string) {
  const value = parts(date, timeZone);
  return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}
export function businessStart(date: string, hour: number, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const wallTime = Date.UTC(year, month - 1, day, hour);
  let instant = wallTime;
  for (let attempt = 0; attempt < 2; attempt++) {
    const value = parts(new Date(instant), timeZone);
    instant += wallTime - Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute);
  }
  return new Date(instant);
}
export function isBusinessSlot(slot: { startsAt: string; endsAt: string }, timeZone: string) {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return false;
  const value = parts(start, timeZone);
  const weekday = new Date(Date.UTC(value.year, value.month - 1, value.day)).getUTCDay();
  return weekday > 0 && weekday < 6 && value.hour >= 9 && value.hour < 18 && value.minute === 0 && start.getUTCSeconds() === 0 && end.getTime() - start.getTime() === 60 * 60_000;
}
