import { getWritable } from "workflow";
import { askAgent, candidateContext, recruiterContext } from "./agents";
import { loadDemoCandidate } from "./fixtures";
import {
  candidateSchema,
  keywordSchema,
  recruiterSchema,
  resultSchema,
} from "./schemas";
import { searchJobsOnDemand } from "./searchJobs";
import { assessConditions } from "./job-conditions";
import type { Job, Message, RunEvent } from "./types";
import { enrichSearchKeywords } from "./search-keywords";
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
  const extracted = await askAgent(
    keywordSchema,
    "구직자 검색 에이전트다. wants, skills, experience, transferableStrengths에서 독립적으로 검색 가능한 짧은 검색어 4~8개를 추출하고 출처 필드를 붙여라. 검색은 의미 검색이 아니라 제목·본문의 문구 전체 부분 일치다. 프로필에 실제로 있는 핵심 기술명 한 개 또는 통상적인 직무명 하나를 각각 반환하라. 예: speech, PyTorch, multimodal, ML Engineer. 서로 다른 키워드나 회사 단계·국가·수식어를 한 문구로 결합하지 마라. 'STT Korean-English code-switching', 'ML Engineer startup', 'AI entertainment voice'처럼 여러 조건을 합친 문구는 금지다. 한 검색어는 최대 3단어로 하고, 해당 프로필과 관계없는 예시 용어는 사용하지 마라. 주 직군 검색어 4~8개는 track=primary로 반환하라. 별도로 2~4개는 주 직군과 wants.roleTypes에 선언된 희망 직군 밖에 있는 구체적인 전환 직업의 검색어를 track=exploration으로 반환하라. 탐색에는 반드시 최소 1개의 관심사 기반(basis=interest) 직업을 포함하라. 개발자 프로필이면 Engineer, Developer, Researcher 같은 개발·연구 직업을 탐색으로 다시 제안하지 마라. 전환 직업 검색어는 공고 제목과 일치해야 하므로 기술명이 아니라 직업명이어야 한다. transferableStrengths의 활동·경력 근거로 제안하면 basis=evidence, wants.interests 등 관심사·언어 능력만으로 제안하면 basis=interest다. primary 검색어에는 basis와 hypothesis를 넣지 마라. 탐색 가설은 30자 이내로 하라. 각 탐색 검색어의 hypothesis에 프로필의 어떤 근거에서 어떤 직업을 제안했는지 짧게 적어라. 예를 들어 커피 관심사만 있는 barista는 자격 확인이 필요한 가설이며 경력으로 만들지 마라. 프로필에 없는 관심사·활동·자격을 만들어내지 마라.",
    input.candidate.publicProfile,
  );
  return { keywords: enrichSearchKeywords(input.candidate.publicProfile, extracted.keywords) };
}

export async function screen(
  keywords: Awaited<ReturnType<typeof extract>>["keywords"],
  country: string,
  primaryRoles: string[],
) {
  "use step";
  return searchJobsOnDemand(keywords, { country, n: 100, primaryRoles });
}

export async function recruiterTurn(
  input: Input,
  job: Job,
  messages: Message[],
  maxTurns: number,
) {
  "use step";
  return askAgent(
    recruiterSchema,
    "공개 공고를 바탕으로 자유롭게 면접을 진행하는 채용 에이전트다. 실제 회사의 대표자나 채용 담당자는 아니다. 대화 이력을 읽고 다음에 확인할 가장 중요한 경험·조건·연봉을 스스로 결정하라. 정해진 단계 순서나 질문 반복은 없다. 이번 발화의 주제를 stage(experience/conditions/salary/salary_check)로 반환하라. 필요한 확인이 끝났거나 더 이상 자료로 판단할 수 없으면 결론과 done=true를 반환하라. 계속할 의미가 있으면 done=false다. turnsRemaining은 양측 발화를 합친 남은 한도다. 한도가 얼마 남지 않았다면 핵심 쟁점을 정리하라. job.text는 JD 일부, job.salary는 연봉 원문이며 빈 문자열은 미기재다. 통화·지급 주기·근무 조건·협상 권한·회사 수락을 만들어내지 마라. 비공개 연봉 하한을 묻지 마라. respond 도구에 message(500자 이하), stage, done을 모두 반드시 반환하라.",
    { ...recruiterContext(input.candidate.publicProfile, input.candidate.docs, job), turnsRemaining: maxTurns - messages.length },
    messages,
  );
}

export async function candidateTurn(
  input: Input,
  job: Job,
  messages: Message[],
  maxTurns: number,
) {
  "use step";
  return askAgent(
    candidateSchema,
    "구직자 대리인이다. 대화 이력을 읽고 자료에 근거해 자유롭게 답변·반문·조건 조율을 하라. 희망 연봉을 협상하되 공개할 수 없는 조건은 인용하지 말고 수락 가능 여부만 답하라. 허락받지 않은 조건에 동의하지 마라. 추가 대화가 유익하면 done=false, 확인이 끝났거나 명백한 불일치라 더 진행할 필요가 없으면 done=true다. 사용자 결정이 반드시 필요하면 needsUser=true와 확인 질문을 반환하라. 나머지는 needsUser=false, question은 빈 문자열이다. turnsRemaining은 양측 발화를 합친 남은 한도다. 없는 경험이나 회사의 확답을 만들어내지 마라. respond 도구의 message(500자 이하), needsUser, question(150자 이하, 없으면 빈 문자열), done을 모두 반드시 반환하라.",
    {
      ...candidateContext(
        input.candidate.publicProfile,
        input.candidate.privateProfile,
      ),
      job,
      turnsRemaining: maxTurns - messages.length,
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
    "공개된 대화·프로필·공고로 AI 사전검토를 평가하라. recommended는 핵심 역량이 맞아 사람과의 면접으로 확인할 가치가 있음, hold는 역량 적합성 자체를 판단할 근거 부족, mismatch는 명백한 필수 역량·조건 불일치다. 연봉·근무시간·협상 여지 미기재나 사용자에게 확인할 조건만으로 보류·불일치시키지 마라. 이미 명시된 수락 불가능한 조건과 핵심 필수 역량 부족은 보존하라. 관심사만으로 필수 경력·자격을 충족했다고 만들지 마라. 추천해도 미확정 조건은 별도로 설명하고 실제 기업의 채용 합격을 확정하지 마라.",
    recruiterContext(input.candidate.publicProfile, input.candidate.docs, job),
    messages,
  );
  return assessConditions(result, job, needsUser);
}

// 외부 호출의 자동 재시도로 해커톤 데모 비용이 늘어나지 않도록 한다.
extract.maxRetries = 0;
recruiterTurn.maxRetries = 0;
candidateTurn.maxRetries = 0;
summarize.maxRetries = 0;
