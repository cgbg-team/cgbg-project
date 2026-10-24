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
import type { Job, Message, Stage } from "../lib/types";

async function interview(input: Awaited<ReturnType<typeof prepare>>, job: Job) {
  const messages: Message[] = [];
  let needsUser = false;
  try {
    for (const stage of [
      "experience",
      "conditions",
      "salary",
    ] satisfies Stage[]) {
      await publish({ type: "stage", jobId: job.id, stage });
      const recruiter = await recruiterTurn(input, job, messages, stage);
      const question: Message = {
        role: "recruiter",
        text: recruiter.message,
        stage,
      };
      messages.push(question);
      await publish({ type: "message", jobId: job.id, message: question });
      const candidate = await candidateTurn(input, job, messages);
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

export async function interviewWorkflow() {
  "use workflow";
  try {
    const input = await prepare();
    await publish({ type: "stage", stage: "keywords" });
    const { keywords } = await extract(input);
    await publish({ type: "keywords", keywords });
    await publish({ type: "stage", stage: "screening" });
    const { selected, excluded } = await screen(input, keywords);
    await publish({ type: "screened", selected, excluded });
    await Promise.all(selected.map(({ job }) => interview(input, job)));
    await publish({ type: "done" });
  } catch {
    await publish({
      type: "error",
      stage: "error",
      error:
        "면접을 시작하지 못했습니다. 서버의 Claude API 키와 샘플 자료를 확인해주세요.",
    });
  } finally {
    await closeEvents();
  }
}
