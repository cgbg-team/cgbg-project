import type { Interview, Job } from "./types";

export function assessConditions(result: NonNullable<Interview["result"]>, job: Job, needsUser: boolean): NonNullable<Interview["result"]> {
  if (result.outcome === "mismatch") return result;
  const missing = [
    job.salary ? "연봉 원문의 통화·지급 주기·수락 가능 금액 확인" : "공고에 미기재된 연봉 확인",
    "근무 방식·주당 근무시간 확인",
    ...(needsUser ? ["구직자 추가 답변"] : []),
  ];
  return { ...result, reasons: [...result.reasons, "별도 확인: " + missing.join(" · ")] };
}
