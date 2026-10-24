import { z } from "zod";

const scheduleSchema = z.object({
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  timeZone: z.string().min(1).refine(value => {
    try { new Intl.DateTimeFormat("ko-KR", { timeZone: value }); return true; } catch { return false; }
  }),
}).refine(value => Date.parse(value.endsAt) > Date.parse(value.startsAt));
export type InterviewSchedule = z.infer<typeof scheduleSchema>;

export function readInterviewSchedules(stored: string | null): InterviewSchedule[] {
  try {
    const value: unknown = JSON.parse(stored ?? "null");
    const result = z.array(scheduleSchema).safeParse(Array.isArray(value) ? value : value ? [value] : []);
    return result.success ? result.data : [];
  } catch { return []; }
}
export function subscribeToSchedule(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("interview-application", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("interview-application", notify);
  };
}
function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/[,;]/g, "\\$&");
}
function foldLine(value: string) {
  let line = "";
  let size = 0;
  const lines: string[] = [];
  for (const character of value) {
    const bytes = new TextEncoder().encode(character).length;
    if (size + bytes > 75) { lines.push(line); line = " "; size = 1; }
    line += character;
    size += bytes;
  }
  return [...lines, line].join("\r\n");
}
export function createInterviewCalendar(company: string, runId: string, jobId: string, slots: InterviewSchedule[], now = new Date()) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MORROW//Interview//KO", "CALSCALE:GREGORIAN"];
  for (const slot of slots) {
    lines.push("BEGIN:VEVENT", `UID:${encodeURIComponent(`${runId}:${jobId}:${slot.startsAt}`)}@morrow`, `DTSTAMP:${stamp(now.toISOString())}`, `DTSTART:${stamp(slot.startsAt)}`, `DTEND:${stamp(slot.endsAt)}`, `SUMMARY:${escapeText(`${company} 면접`)}`, "END:VEVENT");
  }
  return [...lines, "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
