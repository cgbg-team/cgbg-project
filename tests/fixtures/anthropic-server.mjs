import http from "node:http";
import { demoExtraction } from "../../packages/shared/src/onboarding/demo.ts";

// 자동 검사 전용 서버다. 실제 앱에는 모의 응답 경로가 없다.
const server = http.createServer(async (request, response) => {
  if (request.url === "/health") { response.end("ok"); return; }
  if (request.method !== "POST" || request.url !== "/v1/messages") { response.writeHead(404).end(); return; }
  let body = "";
  for await (const chunk of request) body += chunk;
  const input = JSON.parse(body);
  const schema = input.output_config?.format?.schema?.properties;
  if (schema?.headline || schema?.salaryResearch) {
    const done = !input.messages[0].content.includes("(none yet)");
    const output = schema.headline
      ? { ...demoExtraction, ...(schema.prefs ? { prefs: { country: "AU", currency: "USD", target: 150000, floor: 110000, remoteOk: true, relocateOk: false, flexibleOn: [], dealbreakers: [], workStyle: [] } } : {}) }
      : { done, salaryResearch: null, questions: done ? [] : [{ id: "r1q1", text: "호주에서 일해볼 의향이 있나요?", why: "희망 국가를 확인합니다.", type: "single", options: ["네", "아니요", "기타"], unit: null, fills: "global" }] };
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ id: "msg_profile", type: "message", role: "assistant", model: input.model, content: [{ type: "text", text: JSON.stringify(output) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 20, output_tokens: 20 } }));
    return;
  }
  const fields = input.tools[0].input_schema.properties;
  const { context } = JSON.parse(input.messages[0].content);
  let output;
  if (fields.keywords) output = { keywords: [{ term: "software engineer", source: "wants" }] };
  else if (fields.outcome) output = { outcome: "recommended", reasons: ["공개 경력의 자동화 경험과 공고가 일치합니다."], advice: [] };
  else if (fields.needsUser) output = { message: `${context.profile.headline}: 공개 자료에 근거해 경험을 설명합니다. 미기재 근무 조건은 확인이 필요합니다.`, needsUser: true, question: "근무 조건을 확인해주세요.", done: true };
  else output = { message: "관련 경험과 공고 원문에 기재된 조건에 대한 의견을 알려주세요.", stage: context.job.salary ? "salary" : "salary_check", done: false };
  if (body.includes('"floor"') || (context.candidateSummary && body.includes("dealbreakers"))) {
    response.writeHead(400).end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "비공개 입력 누출" } }));
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: input.model, content: [{ type: "tool_use", id: "tool_test", name: "respond", input: output }], stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 20, output_tokens: 20 } }));
});
server.listen(4312, "127.0.0.1");
