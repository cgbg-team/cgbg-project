import type { PublicProfile } from "@cgbg/shared/profile";
import type { z } from "zod";
import type { jobSchema } from "./schemas";

export const stageLabels = {
  queued: "면접 대기 중",
  keywords: "검색 키워드 추출 중…",
  screening: "채용공고 스크리닝 중…",
  interviewing: "에이전트 대화 중…",
  experience: "경험 확인 중…",
  conditions: "근무 조건 확인 중…",
  salary: "연봉 협상 중…",
  salary_check: "연봉 정보 확인 중…",
  summarizing: "면접 결과 정리 중…",
  waiting: "내 답변을 기다리고 있어요",
  completed: "면접 완료",
  error: "실행 오류",
  cancelled: "취소됨",
} as const;

export type Stage = keyof typeof stageLabels;
export type Outcome = "recommended" | "hold" | "mismatch";
export type Job = z.infer<typeof jobSchema>;
export type JobSearch = { total: number; countryTotal: number; matched: number; companies: number; country: string; candidateCount?: number; explorationCount?: number; explorationTarget?: number; live?: number };
export type Keyword = {
  term: string;
  source: "wants" | "skills" | "experience" | "transferableStrengths";
  track?: "primary" | "exploration";
  basis?: "evidence" | "interest";
  hypothesis?: string;
};
export type CandidateMatch = { job: Job; reasons: string[]; track?: "primary" | "exploration"; basis?: "evidence" | "interest"; hypothesis?: string };
export type Message = {
  role: "candidate" | "recruiter";
  text: string;
  stage: Stage;
};
export type Interview = {
  job: Job;
  stage: Stage;
  messages: Message[];
  matchReasons: string[];
  result?: { outcome: Outcome; reasons: string[]; advice?: string[]; adviceSource?: { label: string; url: string } };
  question?: string;
  error?: string;
};
export type RunEvent = {
  type:
    | "profile"
    | "stage"
    | "keywords"
    | "screened"
    | "message"
    | "question"
    | "result"
    | "error"
    | "done";
  at: string;
  profile?: PublicProfile;
  source?: "upload" | "demo";
  jobId?: string;
  stage?: Stage;
  keywords?: Keyword[];
  selected?: CandidateMatch[];
  candidates?: CandidateMatch[];
  excluded?: { job: Job; reason: string }[];
  search?: JobSearch;
  message?: Message;
  question?: string;
  result?: Interview["result"];
  error?: string;
};
export type Snapshot = {
  progressLogs: { at: string; text: string }[];
  profile?: PublicProfile;
  source?: "upload" | "demo";
  search?: JobSearch;
  stage: Stage;
  keywords: Keyword[];
  interviews: Interview[];
  candidates: CandidateMatch[];
  excluded: { job: Job; reason: string }[];
  done: boolean;
  error?: string;
};

export const emptySnapshot: Snapshot = {
  progressLogs: [],
  stage: "queued",
  keywords: [],
  interviews: [],
  candidates: [],
  excluded: [],
  done: false,
};

export function applyEvent(state: Snapshot, event: RunEvent): Snapshot {
  if (!event.jobId) {
    const text = event.type === "profile" ? "프로필 준비 완료 · 경험과 희망 조건을 확인했습니다."
      : event.type === "keywords" ? `${(event.keywords ?? []).map(keyword => keyword.term).join(", ")} 검색어로 검색합니다…`
      : event.type === "screened" ? `후보 공고 ${event.selected?.length ?? 0}개를 찾았습니다. 기업별 에이전트 면접을 시작합니다.`
      : event.type === "done" ? "기업별 면접과 후보 추림을 마쳤습니다. 최종 결과를 확인해주세요."
      : event.type === "error" ? event.error
      : event.type === "stage" && event.stage ? stageLabels[event.stage] : undefined;
    if (text && state.progressLogs.at(-1)?.text !== text) state = { ...state, progressLogs: [...state.progressLogs, { at: event.at, text }] };
  }
  if (event.type === "profile")
    return { ...state, profile: event.profile, source: event.source };
  if (event.type === "keywords")
    return { ...state, keywords: event.keywords ?? [] };
  if (event.type === "screened")
    return {
      ...state,
      stage: "experience",
      candidates: event.candidates ?? event.selected ?? [],
      interviews: (event.selected ?? []).map(({ job, reasons }) => ({
        // 이전 실행의 변환된 공고도 24시간 기록 복원에 사용한다.
        job: typeof job.salary === "string" ? job : {
          ...job,
          salary: "salaryText" in job && typeof job.salaryText === "string" ? job.salaryText : "",
          text: "description" in job && typeof job.description === "string" ? job.description : "",
        },
        stage: "queued",
        messages: [],
        matchReasons: reasons,
      })),
      excluded: event.excluded ?? [],
      search: event.search,
    };
  if (event.type === "done")
    return { ...state, stage: "completed", done: true };
  if (!event.jobId)
    return {
      ...state,
      stage: event.stage ?? state.stage,
      error: event.error ?? state.error,
      done: event.type === "error" ? true : state.done,
    };
  return {
    ...state,
    interviews: state.interviews.map((item) =>
      item.job.id !== event.jobId
        ? item
        : {
            ...item,
            stage: event.stage ?? item.stage,
            messages: event.message
              ? [...item.messages, event.message]
              : item.messages,
            question:
              event.type === "question" ? event.question : item.question,
            result: event.result ?? item.result,
            error: event.error ?? item.error,
          },
    ),
  };
}
