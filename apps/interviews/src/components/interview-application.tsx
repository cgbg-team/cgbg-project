"use client";

import { useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { readInterviewSchedules, subscribeToSchedule, type InterviewSchedule } from "@/lib/interview-schedule";
import { companyTimeZone } from "@/lib/interview-hours";
import { InterviewCalendar } from "./interview-calendar";

export function InterviewApplication({ runId, jobId, company, country, location, label = "면접 신청하기 ↗" }: { runId: string; jobId: string; company: string; country: string; location?: string; label?: string }) {
  const router = useRouter();
  const timeZone = companyTimeZone(country, location);
  const key = `cgbg-application:v1:${runId}:${jobId}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const stored = useSyncExternalStore(subscribeToSchedule, () => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, () => null);
  let confirmed: string[] | undefined;
  let initialSlots: InterviewSchedule[] = [];
  try {
    const schedules = readInterviewSchedules(stored);
    if (schedules.length && schedules.every(slot => slot?.startsAt && slot.endsAt && slot.timeZone)) confirmed = schedules.map(slot => {
      const start = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: slot.timeZone }).format(new Date(slot.startsAt));
      const end = new Intl.DateTimeFormat("ko-KR", { timeStyle: "short", timeZone: slot.timeZone }).format(new Date(slot.endsAt));
      return `${start} ~ ${end} · ${slot.timeZone}`;
    });
    if (confirmed) initialSlots = schedules;
  } catch { /* 이전 신청 상태에는 일정 정보가 없다. */ }
  function confirm(schedule: InterviewSchedule[]) {
    try {
      localStorage.setItem(key, JSON.stringify(schedule));
      window.dispatchEvent(new Event("interview-application"));
      dialog.current?.close();
      router.push(`/interview-complete?${new URLSearchParams({ run: runId, job: jobId, company })}`);
    } catch { return "일정을 저장하지 못했습니다. 브라우저 저장 설정을 확인해주세요."; }
  }
  return <div className="notice" aria-label="면접 신청">
    {confirmed && <div role="status"><strong>면접 일정 확정 · 체험</strong><ul>{confirmed.map(slot => <li key={slot}>{slot}</li>)}</ul><small>선택한 시간 {confirmed.length}개 · 기업 확인 전</small></div>}
    <button className={`button ${confirmed ? "secondary" : "primary"}`} disabled={!timeZone} onClick={() => dialog.current?.showModal()}>{confirmed ? "일정 변경하기" : label}</button>
    {!timeZone && <p>채용 국가 정보가 없어 영업시간을 확인할 수 없습니다.</p>}
    <dialog ref={dialog} className="interview-calendar-dialog" aria-label={`${company} 면접 일정 잡기`}>{timeZone && <InterviewCalendar country={country} timeZone={timeZone} key={`${key}:${stored ?? "new"}`} initialSlots={initialSlots} company={company} onConfirm={confirm} onClose={() => dialog.current?.close()} />}</dialog>
  </div>;
}
