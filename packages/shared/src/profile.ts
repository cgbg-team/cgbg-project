export type Evidence = {
  source: "resume" | "interview" | "github" | "portfolio";
  docPath?: string;
  quote?: string;
};

export type Skill = {
  name: string;
  level?: "basic" | "working" | "expert";
  years?: number;
  verified: boolean;
  evidence: Evidence[];
};

export type Experience = {
  title: string;
  orgDescription: string;
  startYear: number;
  endYear?: number;
  highlights: string[];
  evidence: Evidence[];
};

export type ProfileDoc = {
  path: string;
  about: string;
  visibility: "public" | "private";
};

export type PublicProfile = {
  schemaVersion: 1;
  candidateId: string;
  headline: string;
  summary: string;
  location: { country: string; remoteOk: boolean; relocateOk: boolean };
  languages: {
    name: string;
    level: "native" | "fluent" | "business" | "basic";
  }[];
  skills: Skill[];
  experience: Experience[];
  transferableStrengths: {
    strength: string;
    why: string;
    evidence: Evidence[];
  }[];
  wants: { roleTypes: string[]; interests: string[]; workStyle?: string[] };
  docs: ProfileDoc[];
};

export type PrivateProfile = {
  schemaVersion: 1;
  candidateId: string;
  salary: {
    currency: "USD" | "KRW";
    target: number;
    floor: number;
    flexibleOn: string[];
  };
  dealbreakers: string[];
  mustEmphasize: string[];
  openQuestions: string[];
  docs: ProfileDoc[];
};
