import "server-only";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import candidate from "../../../../data/demo/candidates/onboarding-example/index.json";
import { candidateManifestSchema, validateCandidate } from "./candidate-input";

export async function loadDemoCandidate() {
  const data = candidateManifestSchema.parse(candidate);
  const root = await realpath(
    path.join(process.cwd(), "../../data/demo/candidates/onboarding-example"),
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

