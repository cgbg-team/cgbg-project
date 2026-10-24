import "server-only";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import candidate from "../data/demo/candidate/index.json";
import orbit from "../data/demo/jobs/orbit/index.json";
import relay from "../data/demo/jobs/relay/index.json";
import folio from "../data/demo/jobs/folio/index.json";
import {
  privateProfileSchema,
  publicProfileSchema,
  jobSchema,
} from "./schemas";

export async function loadDemoCandidate() {
  const data = z
    .object({
      confirmed_at: z.iso.datetime(),
      salaryPeriod: z.literal("annual"),
      publicProfile: publicProfileSchema,
      privateProfile: privateProfileSchema,
    })
    .parse(candidate);
  if (data.publicProfile.candidateId !== data.privateProfile.candidateId)
    throw new Error("공개·비공개 프로필 ID가 다릅니다.");
  const root = await realpath(
    path.join(process.cwd(), "src/data/demo/candidate"),
  );
  const docs = await Promise.all(
    data.publicProfile.docs.map(async (doc) => {
      const resolved = await realpath(path.resolve(root, doc.path));
      if (!resolved.startsWith(root + path.sep))
        throw new Error("자료 폴더를 벗어난 경로입니다.");
      const content = await readFile(resolved, "utf8");
      if (content.length > 30_000)
        throw new Error("샘플 문서 크기를 초과했습니다.");
      return { path: doc.path, content };
    }),
  );
  const references = [
    ...data.publicProfile.skills,
    ...data.publicProfile.experience,
    ...data.publicProfile.transferableStrengths,
  ].flatMap((item) => item.evidence);
  for (const evidence of references) {
    if (!evidence.docPath) continue;
    const [file, anchor] = evidence.docPath.split("#");
    const source = docs.find((doc) => doc.path === file);
    const headings = source?.content
      .split("\n")
      .filter((line) => /^#{1,6}\s/.test(line))
      .map((line) =>
        line
          .replace(/^#+\s+/, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),
      );
    if (
      !source ||
      (anchor &&
        !headings?.includes(anchor) &&
        !source.content.includes(`id="${anchor}"`))
    )
      throw new Error("근거 문서 또는 앵커가 없습니다.");
  }
  return { ...data, docs };
}

export function loadDemoJobs() {
  return z
    .array(jobSchema)
    .max(10)
    .refine((jobs) => new Set(jobs.map((job) => job.id)).size === jobs.length)
    .parse([orbit, relay, folio]);
}
