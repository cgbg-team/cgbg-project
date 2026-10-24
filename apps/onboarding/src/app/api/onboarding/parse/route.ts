import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parseAgentExport } from "@/lib/onboarding/agent-export";
import { buildCandidateFolder } from "@/lib/onboarding/build";
import { extractProfile } from "@/lib/onboarding/extract";
import { questions } from "@/lib/onboarding/questions";

const pdfLimit = 5_000_000;
const textLimit = 30_000;

const formSchema = z.object({
  locale: z.enum(["ko", "en"]),
  resumeText: z.string().max(textLimit),
  extraText: z.string().max(textLimit),
  agentExport: z.string().max(100_000),
  direction: z.enum(questions.direction),
  pay: z.enum(questions.pay),
  priority: z.enum(questions.priority),
  country: z.string().trim().min(1).max(100),
  currency: z.enum(["USD", "KRW"]),
  target: z.coerce.number().positive(),
  floor: z.coerce.number().positive(),
  remoteOk: z.enum(["true", "false"]),
  relocateOk: z.enum(["true", "false"]),
  dealbreakers: z.string().max(2_000),
});

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "입력 형식을 확인해주세요." }, { status: 400 });
  }
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const parsed = formSchema.safeParse(
    Object.fromEntries(Object.keys(formSchema.shape).map((key) => [key, field(key)])),
  );
  if (!parsed.success)
    return Response.json(
      { error: `입력값을 확인해주세요: ${parsed.error.issues[0]?.path.join(".")}` },
      { status: 400 },
    );
  const data = parsed.data;
  if (data.floor > data.target)
    return Response.json({ error: "최저 연봉은 희망 연봉보다 클 수 없습니다." }, { status: 400 });

  let agent: ReturnType<typeof parseAgentExport> | undefined;
  if (data.agentExport.trim()) {
    try {
      agent = parseAgentExport(data.agentExport);
      data.resumeText = agent.resumeText;
      data.extraText = agent.extraText;
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
  }

  const file = form.get("resumeFile");
  let resumePdf: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf")
      return Response.json({ error: "이력서 파일은 PDF만 지원합니다." }, { status: 415 });
    if (file.size > pdfLimit)
      return Response.json({ error: "PDF는 5MB 이하여야 합니다." }, { status: 413 });
    resumePdf = Buffer.from(await file.arrayBuffer()).toString("base64");
  }
  if (!resumePdf && !data.resumeText.trim())
    return Response.json({ error: "이력서 PDF나 텍스트를 넣어주세요." }, { status: 400 });

  try {
    const { extraction, mock } = await extractProfile({
      resumePdf,
      resumeText: data.resumeText.trim() || undefined,
      extraText: data.extraText.trim() || undefined,
      agentInsights: agent?.insightsText,
      locale: data.locale,
    });
    const folder = buildCandidateFolder(extraction, {
      answers: { direction: data.direction, pay: data.pay, priority: data.priority },
      country: data.country,
      currency: data.currency,
      target: data.target,
      floor: data.floor,
      remoteOk: data.remoteOk === "true",
      relocateOk: data.relocateOk === "true",
      dealbreakers: data.dealbreakers.split("\n").map((line) => line.trim()).filter(Boolean),
      selfInsightMd: agent?.selfInsightMd,
    }, `cand_${randomUUID()}`);
    return Response.json({ ...folder, mock });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "프로필을 생성하지 못했습니다." },
      { status: 502 },
    );
  }
}
