import { cookies } from "next/headers";
import { start, getRun } from "workflow/api";
import { interviewWorkflow } from "@/workflows/interviews";
import {
  inputError,
  uploadLimit,
  validateCandidate,
  type CandidateInput,
} from "@/lib/candidate-input";
import {
  allowStart,
  configurationReady,
  createSession,
  sameOrigin,
  sessionCookie,
  sessionRun,
} from "@/lib/access";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  if (!configurationReady())
    return Response.json(
      {
        error:
          "서버의 ANTHROPIC_API_KEY와 INTERVIEW_SESSION_SECRET 설정이 필요합니다.",
      },
      { status: 503 },
    );
  const jar = await cookies();
  const country = (new URL(request.url).searchParams.get("country") ?? "").trim().toUpperCase();
  if (country && !/^(?:[A-Z]{2}|\?)$/.test(country)) return Response.json({ error: "국가 코드를 확인해주세요." }, { status: 400 });
  let candidate: CandidateInput | null = null;
  try {
    if (request.body) {
      const reader = request.body.getReader();
      const decoder = new TextDecoder();
      let total = 0;
      let body = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > uploadLimit) {
          await reader.cancel();
          return Response.json(
            { error: "자료 전체 크기는 1MB 이하여야 합니다." },
            { status: 413 },
          );
        }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
      if (body.trim()) {
        if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "JSON 형식의 프로필을 보내주세요." }, { status: 415 });
        candidate = validateCandidate(JSON.parse(body));
        // 사용자가 화면에서 내용을 확인하고 시작한 시점을 확정 시각으로 기록한다.
        candidate.confirmed_at = new Date().toISOString();
      }
    }
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof SyntaxError
            ? "프로필 JSON 문법을 확인해주세요."
            : inputError(error),
      },
      { status: 400 },
    );
  }
  const current = sessionRun(jar.get(sessionCookie)?.value);
  if (current) {
    const run = getRun(current);
    if (
      (await run.exists) &&
      ["pending", "running"].includes(await run.status)
    ) {
      if (candidate)
        return Response.json(
          {
            error:
              "기존 면접이 진행 중입니다. 완료하거나 중지한 뒤 새 자료로 시작해주세요.",
          },
          { status: 409 },
        );
      return Response.json({ runId: current });
    }
  }
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowStart(address))
    return Response.json(
      {
        error: "잠시 후 다시 시작해주세요. 실행 시작은 분당 1회로 제한됩니다.",
      },
      { status: 429 },
    );
  try {
    const run = await start(interviewWorkflow, [candidate, country]);
    jar.set(sessionCookie, createSession(run.runId), {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" &&
        new URL(request.url).protocol === "https:",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });
    return Response.json({ runId: run.runId });
  } catch {
    return Response.json(
      {
        error: "서버 실행을 등록하지 못했습니다. Workflow 설정을 확인해주세요.",
      },
      { status: 503 },
    );
  }
}
