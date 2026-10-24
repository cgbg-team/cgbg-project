import { expect, test } from "vitest";
import { interviewMarkdown, transcript, type Round } from "./interview";

const rounds: Round[] = [
  {
    questions: [
      { id: "r1q1", text: "해외 근무를 고려하는 국가는?", why: "", type: "multi", options: ["일본", "싱가포르", "기타"], unit: null, fills: "global" },
      { id: "r1q2", text: "희망 연봉은?", why: "", type: "number", options: [], unit: "USD/년", fills: "salaryTarget" },
    ],
    answers: { r1q1: ["일본", "기타: 캐나다"], r1q1__note: "원격이면 더 좋아요", r1q2: "" },
  },
];

test("응답 기록에 선택·직접 입력·덧붙인 말을 함께 남기고 빈 답은 표시한다", () => {
  expect(transcript(rounds)).toContain("A: 일본, 기타: 캐나다 (note: 원격이면 더 좋아요)");
  expect(transcript(rounds)).toContain("A: (no answer)");
  expect(interviewMarkdown(rounds)).toContain("## 해외 근무를 고려하는 국가는?\n\n일본, 기타: 캐나다 (note: 원격이면 더 좋아요)");
});
