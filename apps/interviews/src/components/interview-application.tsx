"use client";

import { useState, useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("interview-application", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("interview-application", notify);
  };
}

export function InterviewApplication({ runId, jobId, company, label = "면접 신청하기 ↗" }: { runId: string; jobId: string; company: string; label?: string }) {
  const key = `cgbg-application:v1:${runId}:${jobId}`;
  const [error, setError] = useState("");
  const applied = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(key) === "applied"; } catch { return false; }
  }, () => false);
  function apply() {
    try {
      localStorage.setItem(key, "applied");
      window.dispatchEvent(new Event("interview-application"));
      setError("");
    } catch { setError("신청 상태를 저장하지 못했습니다. 브라우저 저장 설정을 확인해주세요."); }
  }
  return <div className="notice" aria-label="면접 신청">
    {applied ? <div role="status"><strong>{company} 면접 신청 완료</strong><p>시연용 신청 상태를 이 브라우저에 저장했습니다.</p></div> : <button className="button primary" onClick={apply}>{label}</button>}
    <p>시연용입니다. 기업에 신청이 전송되거나 일정이 확정되지는 않습니다.</p>
    {error && <p role="alert">{error}</p>}
  </div>;
}
