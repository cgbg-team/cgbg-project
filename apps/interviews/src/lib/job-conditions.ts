import type { Interview, Job } from "./types";

export function assessConditions(result: NonNullable<Interview["result"]>, job: Job, needsUser: boolean): NonNullable<Interview["result"]> {
  if (result.outcome === "mismatch") return result;
  // shortcut: 정규화된 근무 조건이 없어 원문 확인 후 확정한다. 구조화된 조건 공급 시 비교를 추가한다.
  const missing = [
    job.salary ? "연봉 원문의 통화·지급 주기·수락 가능 금액 확인" : "공고에 미기재된 연봉 확인",
    "근무 방식·주당 근무시간 확인",
    ...(needsUser ? ["구직자 추가 답변"] : []),
  ];
  return { outcome: "hold", reasons: [missing.join(" · ") + "이 필요합니다.", ...result.reasons.slice(0, 2)] };
}
