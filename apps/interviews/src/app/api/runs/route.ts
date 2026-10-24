import { cookies } from "next/headers";
import { start, getRun } from "workflow/api";
import { interviewWorkflow } from "@/workflows/interviews";
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
  const current = sessionRun(jar.get(sessionCookie)?.value);
  if (current) {
    const run = getRun(current);
    if ((await run.exists) && ["pending", "running"].includes(await run.status))
      return Response.json({ runId: current });
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
    const run = await start(interviewWorkflow, []);
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
