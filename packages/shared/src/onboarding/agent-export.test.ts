import { expect, test } from "vitest";
import { agentExportFormat, parseAgentExport } from "./agent-export";
import { demoAgentExport } from "./demo";

test("에이전트 JSON의 경력·학력은 이력서로, 나머지는 추가 자료로 나눈다", () => {
  const { resumeText, extraText } = parseAgentExport(`\`\`\`json\n${demoAgentExport}\n\`\`\``);
  expect(resumeText).toContain("[work] 머신러닝 엔지니어, 음성 AI 스타트업");
  expect(resumeText).toContain("[education] 세종대학교");
  expect(resumeText).not.toContain("[project]");
  expect(extraText).toContain("[project] Piano2Midi");
});

test("인사이트는 가설로 넘기고 약점·일하는 스타일은 비공개 문서로만 분리한다", () => {
  const raw = JSON.parse(demoAgentExport);
  const exported = JSON.stringify({
    ...raw,
    insights: { ...raw.insights, weaknesses: [{ text: "긴 회의에서 집중이 떨어진다" }] },
  });
  const { insightsText, selfInsightMd, plannerJson } = parseAgentExport(exported);
  expect(insightsText).toContain("## Talents\n- 어려운 기술을 쉽게 풀어 설명한다");
  expect(insightsText).toContain("DevRel(개발자 관계) 엔지니어");
  expect(insightsText).not.toContain("긴 회의");
  expect(selfInsightMd).toContain("## Weaknesses\n- 긴 회의에서 집중이 떨어진다");
  expect(selfInsightMd).toContain("## Work style");
  // 질문 설계용 JSON에는 gaps·제안을 남기고 약점·일하는 스타일은 뺀다.
  expect(plannerJson).toContain("Kitsch Labs를 운영하면서");
  expect(plannerJson).not.toContain("긴 회의");
  expect(plannerJson).not.toContain("작은 팀에서 연구와 제품을");
});

test("형식이 틀리거나 경력이 없으면 이유를 알린다", () => {
  expect(() => parseAgentExport("{not json")).toThrow("JSON 문법");
  expect(() => parseAgentExport(JSON.stringify({ format: "other", items: [] }))).toThrow("형식");
  expect(() =>
    parseAgentExport(JSON.stringify({ format: agentExportFormat, items: [{ category: "interest", title: "Coffee" }] })),
  ).toThrow("경력");
});
