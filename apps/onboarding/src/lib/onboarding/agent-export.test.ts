import { expect, test } from "vitest";
import { agentExportFormat, parseAgentExport } from "./agent-export";
import { demoAgentExport } from "./demo";

test("에이전트 JSON의 경력·학력은 이력서로, 나머지는 추가 자료로 나눈다", () => {
  const { resumeText, extraText } = parseAgentExport(`\`\`\`json\n${demoAgentExport}\n\`\`\``);
  expect(resumeText).toContain("[work] Attending Radiologist");
  expect(resumeText).not.toContain("[project]");
  expect(extraText).toContain("[project] Vintage lever machine restoration");
});

test("형식이 틀리거나 경력이 없으면 이유를 알린다", () => {
  expect(() => parseAgentExport("{not json")).toThrow("JSON 문법");
  expect(() => parseAgentExport(JSON.stringify({ format: "other", items: [] }))).toThrow("형식");
  expect(() =>
    parseAgentExport(JSON.stringify({ format: agentExportFormat, items: [{ category: "interest", title: "Coffee" }] })),
  ).toThrow("경력");
});
