import {
  prepare,
  extract,
  screen,
  publish,
  closeEvents,
  recruiterTurn,
  candidateTurn,
  summarize,
} from "../lib/steps";
import type { Job, Message } from "../lib/types";
import type { CandidateInput } from "../lib/candidate-input";

async function interview(input: Awaited<ReturnType<typeof prepare>>, job: Job, maxTurns: number) {
  const messages: Message[] = [];
  let needsUser = false;
  try {
    await publish({ type: "stage", jobId: job.id, stage: "interviewing" });
    while (messages.length < maxTurns) {
      const recruiter = await recruiterTurn(input, job, messages, maxTurns);
      const stage = recruiter.stage;
      await publish({ type: "stage", jobId: job.id, stage });
      const question: Message = {
        role: "recruiter",
        text: recruiter.message,
        stage,
      };
      messages.push(question);
      await publish({ type: "message", jobId: job.id, message: question });
      if (recruiter.done || messages.length >= maxTurns) break;
      const candidate = await candidateTurn(input, job, messages, maxTurns);
      const answer: Message = {
        role: "candidate",
        text: candidate.message,
        stage,
      };
      messages.push(answer);
      await publish({ type: "message", jobId: job.id, message: answer });
      if (candidate.needsUser) {
        needsUser = true;
        await publish({
          type: "question",
          jobId: job.id,
          question: candidate.question || "이 조건을 확인해주세요.",
        });
      }
      if (candidate.done || needsUser) break;
    }
    await publish({ type: "stage", jobId: job.id, stage: "summarizing" });
    const result = await summarize(input, job, messages, needsUser);
    await publish({
      type: "result",
      jobId: job.id,
      stage: "completed",
      result,
    });
  } catch {
    await publish({
      type: "error",
      jobId: job.id,
      stage: "error",
      error:
        "이 기업의 면접을 완료하지 못했습니다. API 설정·사용량을 확인한 뒤 새 면접을 시작해주세요.",
    });
  }
}

export async function interviewWorkflow(
  candidate: CandidateInput | null = null,
  country = "",
  maxTurns = 20,
) {
  "use workflow";
  try {
    const input = await prepare(candidate);
    await publish({
      type: "profile",
      profile: input.candidate.publicProfile,
      source: candidate ? "upload" : "demo",
    });
    await publish({ type: "stage", stage: "keywords" });
    const { keywords } = await extract(input);
    await publish({ type: "keywords", keywords });
    await publish({ type: "stage", stage: "screening" });
    const { selected: candidates, search } = await screen(keywords, country, input.candidate.publicProfile.wants.roleTypes);
    const selected = candidates;
    await publish({ type: "screened", selected, candidates, search });
    await Promise.all(selected.map(({ job }) => interview(input, job, maxTurns)));
    await publish({ type: "done" });
  } catch {
    await publish({
      type: "error",
      stage: "error",
      error:
        "면접을 시작하지 못했습니다. Claude API 설정과 프로필 자료를 확인해주세요.",
    });
  } finally {
    await closeEvents();
  }
}
