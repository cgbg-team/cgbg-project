"use client";

import Link from "next/link";
import { MorrowLogo } from "@cgbg/shared/brand/logo";
import { useState, useSyncExternalStore } from "react";
import { createInterviewCalendar, readInterviewSchedules, subscribeToSchedule } from "@/lib/interview-schedule";

export function InterviewComplete({ runId, jobId, company }: { runId: string; jobId: string; company: string }) {
  const [error, setError] = useState("");
  const stored = useSyncExternalStore(subscribeToSchedule, () => {
    try { return localStorage.getItem(`cgbg-application:v1:${runId}:${jobId}`); } catch { return null; }
  }, () => undefined);
  const slots = readInterviewSchedules(stored ?? null);
  function addToCalendar() {
    try {
      const content = createInterviewCalendar(company, runId, jobId, slots);
      const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "morrow-interviews.ics";
      link.click();
      URL.revokeObjectURL(url);
      setError("");
    } catch { setError("캘린더 파일을 만들지 못했어요. 다시 시도해주세요."); }
  }
  return <main className="interview-complete">
    <header className="morrow-completion-nav"><MorrowLogo /></header>
    <section>
      {stored === undefined ? <p role="status">면접 일정을 확인하고 있어요.</p> : slots.length ? <>
        <div className="completion-emoji" aria-hidden="true">🎉</div>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1>축하해요!<br />다음 기회를 향한 준비가 끝났어요.</h1>
        <p>{company} 면접 일정이 저장됐어요.<br />캘린더에 추가하고 다음 만남을 준비해보세요.</p>
        <ul className="completion-slots" aria-label="선택한 면접 일정">
          {slots.map(slot => <li key={slot.startsAt}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: slot.timeZone }).format(new Date(slot.startsAt))} · {slot.timeZone}</li>)}
        </ul>
        <button type="button" className="button primary" onClick={addToCalendar}>캘린더에 추가하기</button>
        {error && <p role="alert">{error}</p>}
      </> : <>
        <h1>저장된 면접 일정을 찾지 못했어요.</h1>
        <p>일정을 선택한 브라우저에서 다시 확인해주세요.</p>
        <Link href="/" className="button primary">홈으로 돌아가기</Link>
      </>}
    </section>
  </main>;
}
