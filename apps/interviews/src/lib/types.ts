export const stageLabels = {
  queued: "면접 대기 중",
  keywords: "검색 키워드 추출 중…",
  screening: "채용공고 스크리닝 중…",
  experience: "경험 확인 중…",
  conditions: "근무 조건 확인 중…",
  salary: "연봉 협상 중…",
  summarizing: "면접 결과 정리 중…",
  waiting: "내 답변을 기다리고 있어요",
  completed: "면접 완료",
  error: "실행 오류",
  cancelled: "취소됨",
} as const;

export type Stage = keyof typeof stageLabels;
export type Outcome = "recommended" | "hold" | "mismatch";
export type Job = {
  id: string;
  company: string;
  title: string;
  description: string;
  skills: string[];
  remote: boolean;
  weeklyHours: number;
  salary: {
    currency: "USD" | "KRW";
    min: number;
    max: number;
    period: "annual";
  };
};
export type Keyword = {
  term: string;
  source: "wants" | "skills" | "experience" | "transferableStrengths";
};
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
  result?: { outcome: Outcome; reasons: string[] };
  question?: string;
  error?: string;
};
export type RunEvent = {
  type:
    | "stage"
    | "keywords"
    | "screened"
    | "message"
    | "question"
    | "result"
    | "error"
    | "done";
  at: string;
  jobId?: string;
  stage?: Stage;
  keywords?: Keyword[];
  selected?: { job: Job; reasons: string[] }[];
  excluded?: { job: Job; reason: string }[];
  message?: Message;
  question?: string;
  result?: Interview["result"];
  error?: string;
};
export type Snapshot = {
  stage: Stage;
  keywords: Keyword[];
  interviews: Interview[];
  excluded: { job: Job; reason: string }[];
  done: boolean;
  error?: string;
};

export const emptySnapshot: Snapshot = {
  stage: "queued",
  keywords: [],
  interviews: [],
  excluded: [],
  done: false,
};

export function applyEvent(state: Snapshot, event: RunEvent): Snapshot {
  if (event.type === "keywords")
    return { ...state, keywords: event.keywords ?? [] };
  if (event.type === "screened")
    return {
      ...state,
      stage: "experience",
      interviews: (event.selected ?? []).map(({ job, reasons }) => ({
        job,
        stage: "queued",
        messages: [],
        matchReasons: reasons,
      })),
      excluded: event.excluded ?? [],
    };
  if (event.type === "done")
    return { ...state, stage: "completed", done: true };
  if (!event.jobId)
    return {
      ...state,
      stage: event.stage ?? state.stage,
      error: event.error ?? state.error,
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
