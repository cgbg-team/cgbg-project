import http from "node:http";

// 자동 검사 전용 서버다. 실제 앱에는 모의 응답 경로가 없다.
const server = http.createServer(async (request, response) => {
  if (request.url === "/health") { response.end("ok"); return; }
  if (request.method !== "POST" || request.url !== "/v1/messages") { response.writeHead(404).end(); return; }
  let body = "";
  for await (const chunk of request) body += chunk;
  const input = JSON.parse(body);
  const fields = input.tools[0].input_schema.properties;
  const { context } = JSON.parse(input.messages[0].content);
  const relay = context.job?.id === "relay";
  let output;
  if (fields.keywords) output = { keywords: [{ term: "software engineer", source: "wants" }] };
  else if (fields.outcome) output = { outcome: "recommended", reasons: ["공개 경력의 자동화 경험과 공고가 일치합니다."] };
  else if (fields.needsUser) output = { message: `${context.profile.headline}: Python과 SQL 자동화 경험을 설명합니다. 원격 근무 조건을 확인했습니다.`, needsUser: relay, question: relay ? "출장이 필요한지 확인해주세요." : "" };
  else output = { message: "관련 자동화 경험과 근무 조건, 공고의 연간 연봉 범위에 대한 의견을 알려주세요." };
  if (body.includes('"floor"') || (context.candidateSummary && body.includes("dealbreakers"))) {
    response.writeHead(400).end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "비공개 입력 누출" } }));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: input.model, content: [{ type: "tool_use", id: "tool_test", name: "respond", input: output }], stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 20, output_tokens: 20 } }));
});
server.listen(4312, "127.0.0.1");
