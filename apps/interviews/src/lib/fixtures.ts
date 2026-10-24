import "server-only";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import candidate from "../data/demo/candidate/index.json";
import orbit from "../data/demo/jobs/orbit/index.json";
import relay from "../data/demo/jobs/relay/index.json";
import folio from "../data/demo/jobs/folio/index.json";
import { jobSchema } from "./schemas";
import { candidateManifestSchema, validateCandidate } from "./candidate-input";

export async function loadDemoCandidate() {
  const data = candidateManifestSchema.parse(candidate);
  const root = await realpath(
    path.join(process.cwd(), "src/data/demo/candidate"),
  );
  const docs = await Promise.all(
    data.publicProfile.docs.map(async (doc) => {
      const resolved = await realpath(path.resolve(root, doc.path));
      if (!resolved.startsWith(root + path.sep))
        throw new Error("자료 폴더를 벗어난 경로입니다.");
      return { path: doc.path, content: await readFile(resolved, "utf8") };
    }),
  );
  return validateCandidate({ ...data, docs });
}

export function loadDemoJobs() {
  return z
    .array(jobSchema)
    .max(10)
    .refine((jobs) => new Set(jobs.map((job) => job.id)).size === jobs.length)
    .parse([orbit, relay, folio]);
}
