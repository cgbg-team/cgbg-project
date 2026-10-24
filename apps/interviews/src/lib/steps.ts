import { getWritable } from "workflow";
import { askAgent, candidateContext, recruiterContext } from "./agents";
import { loadDemoCandidate } from "./fixtures";
import {
  candidateSchema,
  keywordSchema,
  recruiterSchema,
  resultSchema,
} from "./schemas";
import { searchJobPool } from "./searchJobs";
import { assessConditions } from "./job-conditions";
import type { Job, Message, RunEvent, Stage } from "./types";
import { validateCandidate, type CandidateInput } from "./candidate-input";

export async function prepare(candidate: CandidateInput | null = null) {
  "use step";
  return {
    candidate: candidate
      ? validateCandidate(candidate)
      : await loadDemoCandidate(),
  };
}
type Input = Awaited<ReturnType<typeof prepare>>;

export async function publish(event: Omit<RunEvent, "at">) {
  "use step";
  const writer = getWritable<RunEvent>().getWriter();
  try {
    await writer.write({ ...event, at: new Date().toISOString() });
  } finally {
    writer.releaseLock();
  }
}

export async function closeEvents() {
  "use step";
  const writer = getWritable<RunEvent>().getWriter();
  try {
    await writer.close();
  } finally {
    writer.releaseLock();
  }
}

export async function extract(input: Input) {
  "use step";
  return askAgent(
    keywordSchema,
    "구직자 검색 에이전트다. wants, skills, experience, transferableStrengths에서 공고 검색어 4~8개를 추출하라. 프로필에 실제로 있는 용어만 사용하고 출처 필드를 붙여라.",
    input.candidate.publicProfile,
  );
}

export async function screen(
  keywords: Awaited<ReturnType<typeof extract>>["keywords"],
  country: string,
) {
  "use step";
  return searchJobPool(keywords, { country, n: 2 });
}

export async function recruiterTurn(
  input: Input,
  job: Job,
  messages: Message[],
  stage: Stage,
) {
  "use step";
  return askAgent(
    recruiterSchema,
    `공개 공고를 바탕으로 면접을 모의 진행하는 에이전트다. 실제 회사의 대표자나 채용 담당자가 아니다. 현재 단계는 ${stage}다. 경험, 근무 조건, 연봉 순서로 질문 하나를 하라. salaryText는 연봉 원문이며 통화·주기를 추정하지 마라. salary_check 단계에는 연봉 미기재 사실을 알리고 추가로 확인할 조건을 정리하라. remote·weeklyHours·salary가 null이면 미확인이다. JD에 명시되지 않은 조건이나 협상 권한·수락을 만들어내지 마라. 구직자에게 비공개 하한을 묻지 마라.`,
    recruiterContext(input.candidate.publicProfile, input.candidate.docs, job),
    messages,
  );
}

export async function candidateTurn(
  input: Input,
  job: Job,
  messages: Message[],
) {
  "use step";
  return askAgent(
    candidateSchema,
    "구직자 대리인이다. 자료에 근거해 답하고 희망 연봉을 협상하라. 공개할 수 없는 희망 조건은 그대로 인용하지 말고 수락 가능 여부만 답하라. 허락받지 않은 조건에 동의하지 마라. 판단 불가 시 needsUser=true와 확인 질문을 반환하라. 나머지는 needsUser=false, question은 빈 문자열이다.",
    {
      ...candidateContext(
        input.candidate.publicProfile,
        input.candidate.privateProfile,
      ),
      job,
    },
    messages,
  );
}

export async function summarize(
  input: Input,
  job: Job,
  messages: Message[],
  needsUser: boolean,
) {
  "use step";
  const result = await askAgent(
    resultSchema,
    "채용 에이전트로서 공개된 대화와 공고만 평가하라. recommended는 대면 면접 추천, hold는 정보 부족, mismatch는 조건 불일치다. 근거를 구체적으로 적고 채용 합격을 확정하지 마라.",
    recruiterContext(input.candidate.publicProfile, input.candidate.docs, job),
    messages,
  );
  return assessConditions(result, job, input.candidate.privateProfile.salary, needsUser);
}

// 외부 호출의 자동 재시도로 해커톤 데모 비용이 늘어나지 않도록 한다.
extract.maxRetries = 0;
recruiterTurn.maxRetries = 0;
candidateTurn.maxRetries = 0;
summarize.maxRetries = 0;
