import { expect, test } from "vitest";
import { buildCandidateFolder } from "./build";
import { demoExtraction } from "./demo";

const prefs = {
  answers: { direction: "openToAll", pay: "flexibleForGrowth", priority: "growth" },
  country: "US",
  currency: "USD",
  target: 150000,
  floor: 110000,
  remoteOk: true,
  relocateOk: false,
  dealbreakers: ["주 60시간 이상 근무"],
} as const;

test("면접 앱 폴더 형식으로 공개·비공개 프로필과 문서를 만든다", () => {
  const { manifest, files } = buildCandidateFolder(
    demoExtraction,
    { ...prefs, dealbreakers: [...prefs.dealbreakers] },
    "cand_1",
    new Date("2026-10-24T03:00:00Z"),
  );
  expect(files.map((file) => file.path)).toEqual([
    "index.json",
    "public/experience.md",
    "public/strengths.md",
    "private/interview.md",
  ]);
  expect(manifest.publicProfile.candidateId).toBe(manifest.privateProfile.candidateId);
  expect(manifest.privateProfile.salary).toMatchObject({ floor: 110000, flexibleOn: ["성장 기회가 좋다면 연봉 조정 가능"] });
  expect(JSON.stringify(manifest.publicProfile)).not.toContain("110000");
  expect(manifest.publicProfile.skills.every((skill) => skill.verified === skill.evidence.length > 0)).toBe(true);
});

test("근거 문장이 없는 역량은 확인되지 않은 것으로 표시한다", () => {
  const extraction = {
    ...demoExtraction,
    skills: [{ name: "Leadership", level: null, years: null, evidence: [{ source: "resume" as const, quote: " " }] }],
  };
  const { manifest } = buildCandidateFolder(extraction, { ...prefs, dealbreakers: [] }, "cand_2");
  expect(manifest.publicProfile.skills[0]).toEqual({ name: "Leadership", verified: false, evidence: [] });
});
