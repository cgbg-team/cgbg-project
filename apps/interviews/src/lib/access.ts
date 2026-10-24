import { createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookie = "interview-session";
export function configurationReady() {
  return (
    !!process.env.ANTHROPIC_API_KEY &&
    (process.env.INTERVIEW_SESSION_SECRET?.length ?? 0) >= 32
  );
}
function sign(value: string) {
  const secret = process.env.INTERVIEW_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("세션 비밀 키를 설정해주세요.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}
export function createSession(runId: string, now = Date.now()) {
  const value = `${runId}.${now + 86_400_000}`;
  return `${value}.${sign(value)}`;
}
export function sessionRun(
  token: string | undefined,
  now = Date.now(),
): string | undefined {
  if (!token || token.length > 300) return;
  const [runId, expires, signature, extra] = token.split(".");
  if (
    extra ||
    !runId ||
    !/^[\w-]+$/.test(runId) ||
    !signature ||
    !Number.isFinite(Number(expires)) ||
    Number(expires) < now
  )
    return;
  const expected = Buffer.from(sign(`${runId}.${expires}`));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? runId
    : undefined;
}

// shortcut: 시작 제한은 프로세스 단위다. 공개 운영 시 공유 저장소 또는 Vercel Firewall로 옮긴다.
const starts = new Map<string, number>();
export function allowStart(address: string, now = Date.now()) {
  for (const [key, expires] of starts) if (expires <= now) starts.delete(key);
  if (starts.has(address) || starts.size >= 1000) return false;
  starts.set(address, now + 60_000);
  return true;
}
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    return (
      ["http:", "https:"].includes(origin.protocol) &&
      origin.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
