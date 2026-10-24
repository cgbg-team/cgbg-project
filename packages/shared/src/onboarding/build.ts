import type {
  Evidence,
  PrivateProfile,
  ProfileDoc,
  PublicProfile,
} from "@cgbg/shared/profile";
import type { Extraction } from "./extraction";
import type { Answers } from "./questions";
import { messages } from "./messages";

export type Preferences = {
  // 고정 질문 3개 응답(기존 입력) 또는 동적 질문 기록(interviewMd·flexibleOn·workStyle) 중 하나를 쓴다.
  answers?: Answers;
  interviewMd?: string;
  flexibleOn?: string[];
  workStyle?: string[];
  country: string;
  currency: "USD" | "KRW";
  target: number;
  floor: number;
  remoteOk: boolean;
  relocateOk: boolean;
  dealbreakers: string[];
  // 개인 에이전트가 준 약점·일하는 스타일. 비공개 문서로만 저장한다.
  selfInsightMd?: string;
};

export type CandidateManifest = {
  confirmed_at: string;
  salaryPeriod: "annual";
  publicProfile: PublicProfile;
  privateProfile: PrivateProfile;
};

export type CandidateFolder = {
  manifest: CandidateManifest;
  files: { path: string; content: string }[];
};

const publicDocs: ProfileDoc[] = [
  { path: "public/experience.md", about: "경력 상세와 성과", visibility: "public" },
  { path: "public/strengths.md", about: "이력서 밖에서 발견한 강점과 근거", visibility: "public" },
];
const interviewDoc: ProfileDoc = { path: "private/interview.md", about: "온보딩 질문 응답 원문", visibility: "private" };
const selfInsightDoc: ProfileDoc = {
  path: "private/self-insight.md",
  about: "개인 에이전트가 본 약점과 일하는 스타일",
  visibility: "private",
};

const flexibleOn: Record<Answers["pay"], string[]> = {
  keepLevel: [],
  flexibleForGrowth: ["성장 기회가 좋다면 연봉 조정 가능"],
  altIncome: ["프로젝트·창업 등 다른 수익 방식 가능"],
};

function toEvidence(items: Extraction["skills"][number]["evidence"]): Evidence[] {
  return items
    .filter((item) => item.quote.trim())
    .map((item) => ({ source: item.source, quote: item.quote.trim() }));
}

function interviewMd(answers?: Answers) {
  if (!answers) return "# 온보딩 질문 응답\n";
  const ko = messages.ko;
  const lines = (Object.keys(answers) as (keyof Answers)[]).map(
    (id) => `## ${ko.q[id]}\n\n${ko.a[answers[id]]}`,
  );
  return `# 온보딩 질문 응답\n\n${lines.join("\n\n")}\n`;
}

// Claude 추출 결과와 사용자가 입력한 조건을 면접 앱의 구직자 폴더 형식으로 묶는다.
export function buildCandidateFolder(
  extraction: Extraction,
  prefs: Preferences,
  candidateId: string,
  now = new Date(),
): CandidateFolder {
  const skills = extraction.skills.map((skill) => {
    const evidence = toEvidence(skill.evidence);
    return {
      name: skill.name,
      ...(skill.level ? { level: skill.level } : {}),
      ...(skill.years != null && skill.years >= 0 ? { years: skill.years } : {}),
      verified: evidence.length > 0,
      evidence,
    };
  });
  const publicProfile: PublicProfile = {
    schemaVersion: 1,
    candidateId,
    headline: extraction.headline,
    summary: extraction.summary,
    location: { country: prefs.country, remoteOk: prefs.remoteOk, relocateOk: prefs.relocateOk },
    languages: extraction.languages,
    skills,
    experience: extraction.experience.map((item) => ({
      title: item.title,
      orgDescription: item.orgDescription,
      startYear: item.startYear,
      ...(item.endYear != null ? { endYear: item.endYear } : {}),
      highlights: item.highlights,
      evidence: toEvidence(item.evidence),
    })),
    transferableStrengths: extraction.hiddenStrengths.map((item) => ({
      strength: item.strength,
      why: item.why,
      evidence: toEvidence(item.evidence),
    })),
    wants: {
      roleTypes: extraction.roleTypes,
      interests: extraction.interests,
      workStyle: prefs.workStyle ?? (prefs.answers ? [messages.ko.a[prefs.answers.priority]] : []),
    },
    docs: publicDocs,
  };
  const privateProfile: PrivateProfile = {
    schemaVersion: 1,
    candidateId,
    salary: {
      currency: prefs.currency,
      target: prefs.target,
      floor: prefs.floor,
      flexibleOn: prefs.flexibleOn ?? (prefs.answers ? flexibleOn[prefs.answers.pay] : []),
    },
    dealbreakers: prefs.dealbreakers,
    mustEmphasize: extraction.mustEmphasize,
    openQuestions: extraction.openQuestions,
    docs: prefs.selfInsightMd ? [interviewDoc, selfInsightDoc] : [interviewDoc],
  };
  const manifest: CandidateManifest = {
    confirmed_at: now.toISOString(),
    salaryPeriod: "annual",
    publicProfile,
    privateProfile,
  };
  return {
    manifest,
    files: [
      { path: "index.json", content: `${JSON.stringify(manifest, null, 2)}\n` },
      { path: "public/experience.md", content: extraction.experienceMd },
      { path: "public/strengths.md", content: extraction.strengthsMd },
      { path: "private/interview.md", content: prefs.interviewMd ?? interviewMd(prefs.answers) },
      ...(prefs.selfInsightMd ? [{ path: selfInsightDoc.path, content: prefs.selfInsightMd }] : []),
    ],
  };
}
