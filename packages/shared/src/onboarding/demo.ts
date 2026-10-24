import type { Extraction } from "./extraction";

// 가상의 데모 인물. 실제 개인 자료가 아니다.
export const demoResume = `Dr. Alex Kim — Radiologist
Seoul, Korea

EXPERIENCE
Attending Radiologist, University Hospital (2,000+ beds, Seoul) — 2014–present
- Read 40,000+ CT/MRI studies per year; subspecialty in chest imaging
- Led adoption of an AI triage tool for chest X-rays across 3 departments
- Teaches imaging interpretation to 20 residents per year

Resident, Radiology, University Hospital — 2010–2014

EDUCATION
M.D., Seoul National University, 2010

LANGUAGES
Korean (native), English (fluent)`;

export const demoExtra = `Blog: "Three Shots Before Rounds" (2019–present, 12k monthly readers)
- Reviews espresso machines and grinders; teardown posts on boiler and pump design
- Repaired and restored 15 vintage lever machines for local cafés

Talks
- Speaker at Seoul Coffee Expo 2023: "What radiologists know about seeing details in espresso extraction"
- Monthly hospital "AI & Medicine" lunch talk host since 2021

Community
- Founded a neighborhood café owners' group (60 members) that shares equipment and repair know-how
- Organized a charity latte-art event that raised $8,000 for a children's ward`;

export const demoExtraction: Extraction = {
  headline: "Radiologist turned detail-obsessed coffee equipment expert and educator",
  summary:
    "Attending radiologist with 10+ years of chest imaging and AI tool adoption experience. Outside medicine, runs a 12k-reader espresso equipment blog, restores machines, speaks publicly and built a 60-member café community. Open to roles that combine technical depth, teaching and community.",
  languages: [
    { name: "Korean", level: "native" },
    { name: "English", level: "fluent" },
  ],
  skills: [
    {
      name: "Medical image analysis",
      level: "expert",
      years: 12,
      evidence: [{ source: "resume", quote: "Read 40,000+ CT/MRI studies per year; subspecialty in chest imaging" }],
    },
    {
      name: "Clinical AI tool adoption",
      level: "working",
      years: null,
      evidence: [{ source: "resume", quote: "Led adoption of an AI triage tool for chest X-rays across 3 departments" }],
    },
    {
      name: "Medical education",
      level: "expert",
      years: null,
      evidence: [{ source: "resume", quote: "Teaches imaging interpretation to 20 residents per year" }],
    },
  ],
  experience: [
    {
      title: "Attending Radiologist",
      orgDescription: "University hospital · 2,000+ beds · Seoul",
      startYear: 2014,
      endYear: null,
      highlights: [
        "40,000+ CT/MRI reads per year",
        "Led AI triage tool adoption across 3 departments",
      ],
      evidence: [{ source: "resume", quote: "Attending Radiologist, University Hospital (2,000+ beds, Seoul) — 2014–present" }],
    },
  ],
  hiddenStrengths: [
    {
      strength: "Coffee equipment knowledge",
      why: "Teardown-level understanding of espresso machines fits product, QA and technical sales roles at coffee equipment companies.",
      evidence: [{ source: "portfolio", quote: "Repaired and restored 15 vintage lever machines for local cafés" }],
    },
    {
      strength: "Public speaking",
      why: "Regular talks to both medical and consumer audiences translate to developer relations, education and evangelist roles.",
      evidence: [{ source: "portfolio", quote: "Monthly hospital \"AI & Medicine\" lunch talk host since 2021" }],
    },
    {
      strength: "Community building",
      why: "Founding and running a 60-member owners' group shows community management and partnership skills.",
      evidence: [{ source: "portfolio", quote: "Founded a neighborhood café owners' group (60 members)" }],
    },
  ],
  roleTypes: [
    "Clinical AI product specialist",
    "Coffee equipment product manager",
    "Medical education content lead",
  ],
  interests: ["specialty coffee", "medical AI", "public speaking", "community"],
  mustEmphasize: ["Explains complex technical detail to non-experts"],
  openQuestions: ["Would you accept a role outside healthcare with a lower starting salary?"],
  experienceMd: `# Experience

## Attending Radiologist
University hospital · 2,000+ beds · Seoul · 2014–present

- 40,000+ CT/MRI reads per year, chest imaging subspecialty
- Led AI triage tool adoption for chest X-rays across 3 departments
- Teaches imaging interpretation to 20 residents per year
`,
  strengthsMd: `# Strengths beyond the résumé

## Coffee equipment knowledge
Runs a 12k-reader espresso equipment blog and restored 15 vintage lever machines.

## Public speaking
Seoul Coffee Expo 2023 speaker; hosts a monthly "AI & Medicine" talk.

## Community building
Founded a 60-member café owners' group; organized a charity event raising $8,000.
`,
};
