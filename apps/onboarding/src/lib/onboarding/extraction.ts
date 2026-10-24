import { z } from "zod";

// Claude가 자료에서 추출하는 값. 연봉·조건 등 사용자가 직접 입력한 값은 포함하지 않는다.
const evidence = z.object({
  source: z.enum(["resume", "portfolio"]),
  quote: z.string(),
});

export const extractionSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  languages: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["native", "fluent", "business", "basic"]),
    }),
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.enum(["basic", "working", "expert"]).nullable(),
      years: z.number().nullable(),
      evidence: z.array(evidence),
    }),
  ),
  experience: z.array(
    z.object({
      title: z.string(),
      orgDescription: z.string(),
      startYear: z.number().int(),
      endYear: z.number().int().nullable(),
      highlights: z.array(z.string()),
      evidence: z.array(evidence),
    }),
  ),
  hiddenStrengths: z.array(
    z.object({ strength: z.string(), why: z.string(), evidence: z.array(evidence) }),
  ),
  roleTypes: z.array(z.string()),
  interests: z.array(z.string()),
  mustEmphasize: z.array(z.string()),
  openQuestions: z.array(z.string()),
  experienceMd: z.string(),
  strengthsMd: z.string(),
});

export type Extraction = z.infer<typeof extractionSchema>;
