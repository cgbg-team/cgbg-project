import { z } from "zod";
import type { PrivateProfile, PublicProfile } from "@cgbg/shared/profile";

const text = z.string().trim().min(1).max(20_000);
const evidence = z.object({
  source: z.enum(["resume", "interview", "github", "portfolio"]),
  docPath: z
    .string()
    .regex(/^public\/(?:[\w-]+\/)*[\w-]+\.md(?:#[\w-]+)?$/)
    .optional(),
  quote: text.optional(),
});
const doc = z.object({
  path: z.string().regex(/^(public|private)\/(?:[\w-]+\/)*[\w-]+\.md$/),
  about: text,
  visibility: z.enum(["public", "private"]),
});

export const publicProfileSchema: z.ZodType<PublicProfile> = z.object({
  schemaVersion: z.literal(1),
  candidateId: text,
  headline: text,
  summary: text,
  location: z.object({
    country: text,
    remoteOk: z.boolean(),
    relocateOk: z.boolean(),
  }),
  languages: z.array(
    z.object({
      name: text,
      level: z.enum(["native", "fluent", "business", "basic"]),
    }),
  ),
  skills: z.array(
    z
      .object({
        name: text,
        level: z.enum(["basic", "working", "expert"]).optional(),
        years: z.number().nonnegative().optional(),
        verified: z.boolean(),
        evidence: z.array(evidence),
      })
      .refine(
        (skill) => !skill.verified || skill.evidence.length > 0,
        "확인된 역량에는 근거가 필요합니다",
      ),
  ),
  experience: z.array(
    z.object({
      title: text,
      orgDescription: text,
      startYear: z.number().int(),
      endYear: z.number().int().optional(),
      highlights: z.array(text),
      evidence: z.array(evidence),
    }),
  ),
  transferableStrengths: z.array(
    z.object({ strength: text, why: text, evidence: z.array(evidence) }),
  ),
  wants: z.object({
    roleTypes: z.array(text),
    interests: z.array(text),
    workStyle: z.array(text).optional(),
  }),
  docs: z.array(
    doc.refine(
      (item) => item.visibility === "public" && item.path.startsWith("public/"),
      "공개 문서 경로가 필요합니다",
    ),
  ),
});

export const privateProfileSchema: z.ZodType<PrivateProfile> = z.object({
  schemaVersion: z.literal(1),
  candidateId: text,
  salary: z
    .object({
      currency: z.enum(["USD", "KRW"]),
      target: z.number().positive(),
      floor: z.number().positive(),
      flexibleOn: z.array(text),
    })
    .refine(
      (salary) => salary.floor <= salary.target,
      "연봉 하한이 목표를 초과합니다",
    ),
  dealbreakers: z.array(text),
  mustEmphasize: z.array(text),
  openQuestions: z.array(text),
  docs: z.array(
    doc.refine(
      (item) =>
        item.visibility === "private" && item.path.startsWith("private/"),
      "비공개 문서 경로가 필요합니다",
    ),
  ),
});

export const jobSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().min(1).max(1000),
  company: z.string().max(500),
  country: z.string().max(10),
  location: z.string().max(2000),
  salary: z.string().max(5000),
  source: z.string().min(1).max(100),
  url: z.url().refine((value) => /^https?:\/\//.test(value)),
  text: z.string().max(3000),
});

export const keywordSchema = z.object({
  keywords: z
    .array(
      z.object({
        term: z.string().trim().min(2).max(60),
        source: z.enum([
          "wants",
          "skills",
          "experience",
          "transferableStrengths",
        ]),
      }),
    )
    .min(1)
    .max(8),
});
export const recruiterSchema = z.object({
  message: z.string().min(1).max(1800),
});
export const candidateSchema = z.object({
  message: z.string().min(1).max(1800),
  needsUser: z.boolean(),
  question: z.string().max(500),
});
export const resultSchema = z.object({
  outcome: z.enum(["recommended", "hold", "mismatch"]),
  reasons: z.array(z.string().min(1).max(500)).min(1).max(3),
});
