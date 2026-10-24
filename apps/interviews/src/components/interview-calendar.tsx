"use client";

import { useState } from "react";
import { businessStart, companyDate, isBusinessSlot } from "@/lib/interview-hours";
import { countryLabel } from "@/lib/job-countries";

import type { InterviewSchedule } from "@/lib/interview-schedule";
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function InterviewCalendar({ company, country, timeZone, initialSlots, onConfirm, onClose }: {
  company: string;
  country: string;
  timeZone: string;
  initialSlots: InterviewSchedule[];
  onConfirm: (schedule: InterviewSchedule[]) => string | undefined;
  onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [month, setMonth] = useState(() => { const [year, month] = companyDate(new Date(now), timeZone).split("-").map(Number); return new Date(year, month - 1, 1); });
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<InterviewSchedule[]>(() => initialSlots.filter(slot => isBusinessSlot(slot, timeZone)).map(slot => ({ startsAt: new Date(slot.startsAt).toISOString(), endsAt: new Date(slot.endsAt).toISOString(), timeZone })));
  const [error, setError] = useState("");
  const today = companyDate(new Date(now), timeZone);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <form className="interview-calendar" onSubmit={event => {
    event.preventDefault();
    setNow(Date.now());
    if (!selected.length || selected.some(slot => new Date(slot.startsAt).getTime() <= Date.now() || !isBusinessSlot(slot, timeZone))) {
      setError("채용사 현지 영업시간 안의 미래 날짜와 시간을 선택해주세요.");
      return;
    }
    setError(onConfirm([...selected].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) ?? "");
  }}>
    <div className="calendar-heading"><div><p className="eyebrow">YOUR NEXT CONVERSATION</p><h2>{company} 면접 일정</h2></div><button type="button" className="text-button" onClick={onClose} aria-label="달력 닫기">✕</button></div>
    <p className="calendar-description">{countryLabel(country)} 현지 평일 09:00~18:00 중 가능한 시간을 여러 개 선택해주세요. 다시 누르면 선택이 해제됩니다.</p>
    <div className="calendar-month"><button type="button" className="button secondary" aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button><strong aria-live="polite">{month.getFullYear()}년 {month.getMonth() + 1}월</strong><button type="button" className="button secondary" aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button></div>
    <div className="calendar-week" aria-hidden="true">{["일", "월", "화", "수", "목", "금", "토"].map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days" role="group" aria-label="면접 날짜 선택">
      {Array.from({ length: month.getDay() }, (_, index) => <span key={`empty-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const key = dateKey(new Date(month.getFullYear(), month.getMonth(), index + 1));
        return <button type="button" key={key} disabled={key < today || [0, 6].includes(new Date(`${key}T12:00:00Z`).getUTCDay())} aria-label={key} aria-pressed={date === key} className={date === key ? "selected" : ""} onClick={() => { setDate(key); setNow(Date.now()); setError(""); }}>{index + 1}</button>;
      })}
    </div>
    <section className="calendar-time" aria-label="면접 시간 선택">
      <p>{date || "날짜를 선택해주세요"} · {timeZone}</p>
      {date && <div className="calendar-slots" role="group" aria-label="1시간 단위 시간 슬롯">
        {Array.from({ length: 9 }, (_, index) => {
          const hour = index + 9;
          const time = `${String(hour).padStart(2, "0")}:00`;
          const start = businessStart(date, hour, timeZone);
          const startsAt = start.toISOString();
          const endsAt = new Date(start.getTime() + 60 * 60_000).toISOString();
          const pressed = selected.some(slot => slot.startsAt === startsAt);
          const label = `${time} ~ ${String(hour + 1).padStart(2, "0")}:00`;
          return <button type="button" key={hour} className={pressed ? "selected" : ""} aria-pressed={pressed}
            disabled={start.getTime() <= now}
            onClick={() => {
              setNow(Date.now());
              setSelected(slots => pressed ? slots.filter(slot => slot.startsAt !== startsAt) : [...slots, { startsAt, endsAt, timeZone }]);
              setError("");
            }}>{label}</button>;
        })}
      </div>}
      <p aria-live="polite">선택한 시간 {selected.length}개</p>
      {selected.length > 0 && <ul className="calendar-selected">
        {[...selected].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map(slot => {
          const label = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(slot.startsAt));
          return <li key={slot.startsAt}><button type="button" aria-label={`${label} 선택 해제`} onClick={() => setSelected(slots => slots.filter(item => item.startsAt !== slot.startsAt))}>{label} ×</button></li>;
        })}
      </ul>}
    </section>
    {error && <p className="calendar-error" role="alert">{error}</p>}
    <button type="submit" className="button primary calendar-confirm" disabled={!selected.length}>일정 확정하기</button>
  </form>;
}
