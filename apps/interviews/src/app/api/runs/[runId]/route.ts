import { cookies } from "next/headers";
import { getRun } from "workflow/api";
import { sameOrigin, sessionCookie, sessionRun } from "@/lib/access";
import type { RunEvent } from "@/lib/types";

type Context = { params: Promise<{ runId: string }> };
async function authorizedRun(context: Context) {
  const { runId } = await context.params;
  const token = (await cookies()).get(sessionCookie)?.value;
  if (sessionRun(token) !== runId) return;
  const run = getRun(runId);
  return (await run.exists) ? run : undefined;
}

export async function GET(request: Request, context: Context) {
  const run = await authorizedRun(context);
  if (!run)
    return Response.json(
      { error: "이 실행에 접근할 수 없습니다." },
      { status: 403 },
    );
  const url = new URL(request.url);
  if (url.searchParams.get("stream") !== "1")
    return Response.json(
      { status: await run.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  const cursor = Number(url.searchParams.get("cursor") ?? 0);
  if (!Number.isSafeInteger(cursor) || cursor < 0)
    return Response.json({ error: "잘못된 기록 위치입니다." }, { status: 400 });
  const encoder = new TextEncoder();
  const stream = run.getReadable<RunEvent>({ startIndex: cursor }).pipeThrough(
    new TransformStream<RunEvent, Uint8Array>({
      transform(event, controller) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      },
    }),
  );
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function DELETE(request: Request, context: Context) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  const run = await authorizedRun(context);
  if (!run)
    return Response.json(
      { error: "이 실행에 접근할 수 없습니다." },
      { status: 403 },
    );
  await run.cancel({ cancelReason: "구직자가 면접을 중지했습니다." });
  return Response.json({ status: "cancelled" });
}
