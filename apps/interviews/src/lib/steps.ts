import { getWritable } from "workflow";
import { askAgent, candidateContext, recruiterContext } from "./agents";
import { loadDemoCandidate } from "./fixtures";
import {
  candidateSchema,
  keywordSchema,
  recruiterSchema,
  resultSchema,
  adviceSchema,
} from "./schemas";
import { searchJobsOnDemand } from "./searchJobs";
import { assessConditions } from "./job-conditions";
import type { Job, Message, RunEvent } from "./types";
import { enrichSearchKeywords } from "./search-keywords";
import { normalizeAdvice } from "./job-advice";
import { withSalaryAdvice } from "./salary-advice";
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
    "공개 공고를 바탕으로 자유롭게 면접을 진행하는 채용 에이전트다. 실제 회사의 대표자나 채용 담당자는 아니다. 대화 이력을 읽고 다음에 확인할 가장 중요한 경험·조건·연봉을 스스로 결정하라. 정해진 단계 순서나 질문 반복은 없다. 이번 발화의 주제를 stage(experience/conditions/salary/salary_check)로 반환하라. 필요한 확인이 끝났거나 더 이상 자료로 판단할 수 없으면 결론과 done=true를 반환하라. 계속할 의미가 있으면 done=false다. turnsRemaining은 양측 발화를 합친 남은 한도다. 한도가 얼마 남지 않았다면 핵심 쟁점을 정리하라. job.text는 JD 일부, job.salary는 연봉 원문이며 빈 문자열은 미기재다. 통화·지급 주기·근무 조건·협상 권한·회사 수락을 만들어내지 마라. 구직자의 우려가 연봉·이주·주거·비자·근무 방식과 관련되면 advertisedBenefits의 label과 evidence 및 공고 원문에 근거해 도움이 될 조건을 먼저 제안하고 수락 가능 여부를 물어라. 예: 공고에 이주 지원이 있으면 이주 부담을 줄이는 선택지로 안내한다. 연봉은 공개 범위 안에서 논의하고 지분·지원 혜택을 포함해 조합을 제안할 수 있다. 공고에 금액이나 지원 대상이 없으면 담당자 확인 필요라고 구분하고 임의의 금액·자격·승인·보장을 붙이지 마라. 미기재된 비자·주거비 지원은 실제 제공 혜택으로 제안하지 말고 담당자에게 지원 가능 여부를 확인할 협상 의제로 제안하라. 지원 불가가 명시된 항목을 지원 가능하다고 바꾸지 마라. 혜택 설명·조건 제안은 실제 회사의 오퍼나 수락이 아니다. 비공개 연봉 하한을 묻지 마라. respond 도구에 message(500자 이하), stage, done을 모두 반드시 반환하라.",
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
    "구직자 대리인이다. 대화 이력을 읽고 자료에 근거해 자유롭게 답변·반문·조건 조율을 하라. 희망 연봉을 협상하되 공개할 수 없는 조건은 인용하지 말고 수락 가능 여부만 답하라. 허락받지 않은 조건에 동의하지 마라. 채용 에이전트가 제안한 비자·주거·이주 지원·지분·근무 방식은 job 원문에 근거가 있는지 확인하고, 구직자의 어떤 우려를 해소하는지 답하라. 미확정 지원 금액·조건은 확인 질문으로 남겨라. 현금 연봉과 지분·주거 지원을 임의로 환산하거나 보장된 총보상으로 합산하지 마라. 추가 대화가 유익하면 done=false, 확인이 끝났거나 명백한 불일치라 더 진행할 필요가 없으면 done=true다. 사용자 결정이 반드시 필요하면 needsUser=true와 확인 질문을 반환하라. 나머지는 needsUser=false, question은 빈 문자열이다. turnsRemaining은 양측 발화를 합친 남은 한도다. 없는 경험이나 회사의 확답을 만들어내지 마라. respond 도구의 message(500자 이하), needsUser, question(150자 이하, 없으면 빈 문자열), done을 모두 반드시 반환하라.",
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
    resultSchema.extend(adviceSchema.shape),
    "공개된 대화·프로필·공고로 AI 사전검토를 평가하라. recommended는 핵심 역량이 맞아 사람과의 면접으로 확인할 가치가 있음, hold는 역량 적합성 자체를 판단할 근거 부족, mismatch는 명백한 필수 역량·조건 불일치다. 연봉·근무시간·협상 여지 미기재나 사용자에게 확인할 조건만으로 보류·불일치시키지 마라. 이미 명시된 수락 불가능한 조건과 핵심 필수 역량 부족은 보존하라. 관심사만으로 필수 경력·자격을 충족했다고 만들지 마라. 대화에서 제안한 공고 기반 지원·보상이 조건 불일치를 해소할 수 있는지 평가하되, 담당자 확인을 제안한 것만으로 제공 확정이나 조건 충족으로 처리하지 마라. 추천해도 미확정 조건은 별도로 설명하고 실제 기업의 채용 합격을 확정하지 마라. reasons는 1~2개, 각각 80자 이내로 간결하게 써라. advice에는 Morrow의 조언을 한국어 3문장 이내로 작성하라. 배열 항목 하나는 한 문장이고 각각 120자 이내다. 첫 문장은 프로필과 맞는 추천 이유 또는 불일치·보류 이유, 둘째 문장은 공고와 대화에 근거한 매력적인 점, 셋째 문장은 추천 연봉 협상 범위 또는 먼저 확인할 보상 조건이다. 연봉 범위는 공고에 명시한 통화·금액 범위 안에서만 제안하고 지급 주기가 불명확하면 확인 필요를 함께 적어라. 연봉 미기재는 숫자를 만들지 말고 범위 공개 요청을 권하라. 복수 직급 범위를 하나의 개인 제안으로 단정하지 말고 지분·지원금을 연봉으로 환산하지 마라.",
    recruiterContext(input.candidate.publicProfile, input.candidate.docs, job),
    messages,
  );
  const advice = withSalaryAdvice(normalizeAdvice(result.advice), job, input.candidate.privateProfile.salary);
  return assessConditions({ ...result, ...advice }, job, needsUser);
}

// 외부 호출의 자동 재시도로 해커톤 데모 비용이 늘어나지 않도록 한다.
extract.maxRetries = 0;
recruiterTurn.maxRetries = 0;
candidateTurn.maxRetries = 0;
summarize.maxRetries = 0;
