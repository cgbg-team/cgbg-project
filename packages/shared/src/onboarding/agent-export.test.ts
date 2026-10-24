import { expect, test } from "vitest";
import { agentExportFormat, parseAgentExport } from "./agent-export";
import { demoAgentExport } from "./demo";

test("에이전트 JSON의 경력·학력은 이력서로, 나머지는 추가 자료로 나눈다", () => {
  const { resumeText, extraText } = parseAgentExport(`\`\`\`json\n${demoAgentExport}\n\`\`\``);
  expect(resumeText).toContain("[work] Attending Radiologist");
  expect(resumeText).not.toContain("[project]");
  expect(extraText).toContain("[project] Vintage lever machine restoration");
});

test("인사이트는 가설로 넘기고 약점·일하는 스타일은 비공개 문서로만 분리한다", () => {
  const { insightsText, selfInsightMd } = parseAgentExport(demoAgentExport);
  expect(insightsText).toContain("## Role ideas\n- Product specialist (Coffee equipment)");
  expect(insightsText).not.toContain("administrative meetings");
  expect(selfInsightMd).toContain("## Weaknesses\n- Loses energy in long administrative meetings");
  expect(selfInsightMd).toContain("## Work style");
});

test("질문 설계용 JSON에는 gaps·제안을 남기고 약점·일하는 스타일은 뺀다", () => {
  const raw = JSON.parse(demoAgentExport);
  const { plannerJson } = parseAgentExport(
    JSON.stringify({ ...raw, gaps: [{ topic: "해외 근무 의향" }], proposals: [{ type: "role_idea", text: "Coffee PM", ownerResponse: "unanswered" }] }),
  );
  expect(plannerJson).toContain("해외 근무 의향");
  expect(plannerJson).toContain("Coffee PM");
  expect(plannerJson).not.toContain("administrative meetings");
  expect(plannerJson).not.toContain("hands-on problems");
});

test("형식이 틀리거나 경력이 없으면 이유를 알린다", () => {
  expect(() => parseAgentExport("{not json")).toThrow("JSON 문법");
  expect(() => parseAgentExport(JSON.stringify({ format: "other", items: [] }))).toThrow("형식");
  expect(() =>
    parseAgentExport(JSON.stringify({ format: agentExportFormat, items: [{ category: "interest", title: "Coffee" }] })),
  ).toThrow("경력");
});
