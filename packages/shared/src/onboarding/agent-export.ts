import { z } from "zod";
import type { Locale } from "./questions";

// 개인 AI 에이전트가 만드는 원자료 형식. 분석·검증은 우리 파서가 한다.
export const agentExportFormat = "beyond-cv/agent-export/v1";

const text = z.string().trim().min(1).max(2_000);
const item = z.object({
  category: z.enum(["work", "education", "project", "activity", "writing", "interest", "other"]),
  title: text,
  detail: z.string().trim().max(2_000).optional(),
  quote: z.string().trim().max(2_000).optional(),
  source: z.string().trim().max(500).optional(),
});
const insight = z.object({
  text,
  why: z.string().trim().max(2_000).optional(),
  basedOn: z.array(z.string().trim().max(500)).max(20).optional(),
});
const insights = z.object({
  interests: z.array(insight).max(20).optional(),
  talents: z.array(insight).max(20).optional(),
  strengths: z.array(insight).max(20).optional(),
  weaknesses: z.array(insight).max(20).optional(),
  workStyle: z.array(insight).max(20).optional(),
  roleIdeas: z
    .array(
      z.object({
        role: text,
        industry: z.string().trim().max(500).optional(),
        why: z.string().trim().max(2_000).optional(),
        basedOn: z.array(z.string().trim().max(500)).max(20).optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const agentExportSchema = z.object({
  format: z.literal(agentExportFormat),
  items: z.array(item).min(1).max(100),
  insights: insights.optional(),
});

export type AgentExport = z.infer<typeof agentExportSchema>;
type Insight = z.infer<typeof insight>;

export type ParsedAgentExport = {
  resumeText: string;
  extraText: string;
  // Claude에 가설로만 넘기는 공개 가능한 인사이트. 약점은 포함하지 않는다.
  insightsText?: string;
  // 본인 에이전트만 읽는 비공개 문서.
  selfInsightMd?: string;
};

const resumeCategories = new Set(["work", "education"]);

function line(entry: AgentExport["items"][number]) {
  return [
    `- [${entry.category}] ${entry.title}`,
    entry.detail && `  ${entry.detail}`,
    entry.quote && `  "${entry.quote}"`,
    entry.source && `  (source: ${entry.source})`,
  ]
    .filter(Boolean)
    .join("\n");
}

function insightLines(list: Insight[] = []) {
  return list.map((entry) =>
    [`- ${entry.text}`, entry.why && ` — ${entry.why}`, entry.basedOn?.length && ` (based on: ${entry.basedOn.join("; ")})`]
      .filter(Boolean)
      .join(""),
  );
}

function section(title: string, lines: string[]) {
  return lines.length ? `## ${title}\n${lines.join("\n")}` : "";
}

// 경력·학력은 이력서 자리로, 나머지는 추가 자료로 나눠 기존 파서에 넣는다.
export function parseAgentExport(raw: string): ParsedAgentExport {
  let json: unknown;
  try {
    json = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new Error("에이전트가 만든 JSON 문법을 확인해주세요.");
  }
  const result = agentExportSchema.safeParse(json);
  if (!result.success)
    throw new Error(`에이전트 JSON 형식을 확인해주세요: ${result.error.issues[0]?.path.join(".") || "format"}`);
  const { items, insights: found } = result.data;
  const resume = items.filter((entry) => resumeCategories.has(entry.category));
  const extra = items.filter((entry) => !resumeCategories.has(entry.category));
  if (!resume.length) throw new Error("경력(work) 또는 학력(education) 항목이 하나 이상 필요합니다.");

  const roleLines = (found?.roleIdeas ?? []).map((idea) =>
    [`- ${idea.role}`, idea.industry && ` (${idea.industry})`, idea.why && ` — ${idea.why}`, idea.basedOn?.length && ` (based on: ${idea.basedOn.join("; ")})`]
      .filter(Boolean)
      .join(""),
  );
  const insightsText = [
    section("Interests", insightLines(found?.interests)),
    section("Talents", insightLines(found?.talents)),
    section("Strengths", insightLines(found?.strengths)),
    section("Role ideas", roleLines),
  ]
    .filter(Boolean)
    .join("\n\n");
  const privateBody = [
    section("Weaknesses", insightLines(found?.weaknesses)),
    section("Work style", insightLines(found?.workStyle)),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    resumeText: `Reported by the candidate's personal AI agent\n${resume.map(line).join("\n")}`,
    extraText: extra.map(line).join("\n"),
    ...(insightsText ? { insightsText } : {}),
    ...(privateBody
      ? { selfInsightMd: `# Self-insight from my personal agent\n\nPrivate. Used only by my own agent to avoid poor-fit roles.\n\n${privateBody}\n` }
      : {}),
  };
}

export function agentPrompt(locale: Locale) {
  const lang = locale === "ko" ? "Korean" : "English";
  return `You are my personal AI agent. Prepare my career materials for BEYOND CV, a service that finds careers beyond my résumé.

Using only what you actually know about me (our conversations, my files, my notes), output ONE JSON object and nothing else:

{
  "format": "${agentExportFormat}",
  "items": [
    {
      "category": "work | education | project | activity | writing | interest | other",
      "title": "short title, e.g. job title and period",
      "detail": "what I did, results, numbers",
      "quote": "an exact sentence from my own materials that supports this",
      "source": "where it came from, e.g. a URL or 'my notes'"
    }
  ],
  "insights": {
    "interests":  [{ "text": "...", "why": "...", "basedOn": ["item titles above"] }],
    "talents":    [{ "text": "...", "why": "...", "basedOn": ["..."] }],
    "strengths":  [{ "text": "...", "why": "...", "basedOn": ["..."] }],
    "weaknesses": [{ "text": "...", "why": "...", "basedOn": ["..."] }],
    "workStyle":  [{ "text": "...", "why": "...", "basedOn": ["..."] }],
    "roleIdeas":  [{ "role": "job title", "industry": "industry", "why": "...", "basedOn": ["..."] }]
  }
}

Rules:
- "items": include every job and degree (work, education) plus side projects, talks, communities, blog posts, hobbies and interests — the non-work items matter most.
- "insights": what you have noticed about me over time — latent interests, natural talents, strengths, honest weaknesses and how I work best. "roleIdeas": 3–5 roles or industries I might not have considered, including at least one outside my current field. Point "basedOn" to item titles.
- Suggest roles and industries only. Do not name specific companies.
- Do not invent or exaggerate anything. If you are unsure, leave it out.
- Do not include contact details, ID numbers, addresses or other people's private information.
- Write all text in ${lang}.`;
}
