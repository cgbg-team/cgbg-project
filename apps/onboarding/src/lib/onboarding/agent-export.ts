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

export const agentExportSchema = z.object({
  format: z.literal(agentExportFormat),
  items: z.array(item).min(1).max(100),
});

export type AgentExport = z.infer<typeof agentExportSchema>;

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

// 경력·학력은 이력서 자리로, 나머지는 추가 자료로 나눠 기존 파서에 넣는다.
export function parseAgentExport(raw: string): { resumeText: string; extraText: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new Error("에이전트가 만든 JSON 문법을 확인해주세요.");
  }
  const result = agentExportSchema.safeParse(json);
  if (!result.success)
    throw new Error(`에이전트 JSON 형식을 확인해주세요: ${result.error.issues[0]?.path.join(".") || "format"}`);
  const items = result.data.items;
  const resume = items.filter((entry) => resumeCategories.has(entry.category));
  const extra = items.filter((entry) => !resumeCategories.has(entry.category));
  if (!resume.length) throw new Error("경력(work) 또는 학력(education) 항목이 하나 이상 필요합니다.");
  return {
    resumeText: `Reported by the candidate's personal AI agent\n${resume.map(line).join("\n")}`,
    extraText: extra.map(line).join("\n"),
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
  ]
}

Rules:
- Include every job and degree (work, education) plus side projects, talks, communities, blog posts, hobbies and interests — the non-work items matter most.
- Do not invent or exaggerate anything. If you are unsure, leave it out.
- Do not include contact details, ID numbers, addresses or other people's private information.
- Write titles and details in ${lang}.`;
}
