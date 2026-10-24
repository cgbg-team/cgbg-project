import type { PrivateProfile } from "@cgbg/shared/profile";
import type { Interview, Job } from "./types";

export function assessConditions(result: NonNullable<Interview["result"]>, job: Job, salary: PrivateProfile["salary"], needsUser: boolean): NonNullable<Interview["result"]> {
  if (job.salary && job.salary.currency !== salary.currency) return { outcome: "hold", reasons: ["연봉 통화가 달라 구직자의 확인이 필요합니다."] };
  if (job.salary && job.salary.max < salary.floor) return { outcome: "mismatch", reasons: ["공고의 연봉 범위가 구직자의 수락 조건과 맞지 않습니다."] };
  if (result.outcome === "mismatch") return result;
  const missing = [
    !job.salary ? job.salaryText ? "연봉 원문의 통화·지급 주기·수락 가능 금액 확인" : "공고에 미기재된 연봉 확인" : "",
    job.remote == null ? "근무 방식 확인" : "",
    job.weeklyHours == null ? "주당 근무시간 확인" : "",
    needsUser ? "구직자 추가 답변" : "",
  ].filter(Boolean);
  return missing.length ? { outcome: "hold", reasons: [missing.join(" · ") + "이 필요합니다.", ...result.reasons.slice(0, 2)] } : result;
}
