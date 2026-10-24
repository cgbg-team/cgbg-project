import { expect, test } from "vitest";
import candidate from "../data/demo/candidate/index.json";
import {
  parseCandidateFiles,
  validateCandidate,
  type CandidateFile,
} from "./candidate-input";
import { applyEvent, emptySnapshot } from "./types";

const files: CandidateFile[] = [
  { path: "my-profile/index.json", content: JSON.stringify(candidate) },
  {
    path: "my-profile/public/experience.md",
    content: "# Experience\n## Automation\nPython SQL 자동화 경험",
  },
  {
    path: "my-profile/public/strengths.md",
    content: "# Strengths\n자동화 경험",
  },
  { path: "my-profile/private/interview.md", content: "PRIVATE_RAW_MARKER" },
];

test("폴더를 v1 입력으로 읽고 비공개 원문을 제외하며 공개 프로필을 복원한다", () => {
  const input = parseCandidateFiles(files);
  expect(input.publicProfile.headline).toBe(candidate.publicProfile.headline);
  expect(input.docs).toHaveLength(2);
  expect(JSON.stringify(input)).not.toContain("PRIVATE_RAW_MARKER");
  const state = applyEvent(emptySnapshot, {
    type: "profile",
    at: "now",
    profile: input.publicProfile,
    source: "upload",
  });
  expect(state.profile?.candidateId).toBe(input.publicProfile.candidateId);
  expect(state.source).toBe("upload");
  expect(
    applyEvent(state, {
      type: "error",
      at: "now",
      stage: "error",
      error: "실패",
    }).done,
  ).toBe(true);
});

test("경로 이탈·중복·누락·과대 입력과 서버에서 변조된 문서를 거부한다", () => {
  expect(() =>
    parseCandidateFiles([
      ...files,
      { path: "my-profile/../secret.md", content: "" },
    ]),
  ).toThrow("경로");
  expect(() => parseCandidateFiles([...files, files[0]])).toThrow("중복");
  expect(() => parseCandidateFiles(files.slice(0, 2))).toThrow("누락");
  expect(() =>
    parseCandidateFiles([
      { path: "index.json", content: "x".repeat(1_000_001) },
    ]),
  ).toThrow("1MB");
  const input = parseCandidateFiles(files);
  expect(() =>
    validateCandidate({
      ...input,
      docs: [
        ...input.docs,
        { path: "private/interview.md", content: "private" },
      ],
    }),
  ).toThrow("일치");
  expect(() =>
    validateCandidate({
      ...input,
      privateProfile: { ...input.privateProfile, candidateId: "other" },
    }),
  ).toThrow("ID");
});
