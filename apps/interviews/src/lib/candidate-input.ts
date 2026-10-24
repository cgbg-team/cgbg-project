import { z } from "zod";
import { publicProfileSchema, privateProfileSchema } from "./schemas";

export const uploadLimit = 1_000_000;
export const fileLimit = 20;
export const candidateManifestSchema = z.object({
  confirmed_at: z.iso.datetime(),
  salaryPeriod: z.literal("annual"),
  publicProfile: publicProfileSchema,
  privateProfile: privateProfileSchema,
});
const inputSchema = candidateManifestSchema.extend({
  docs: z
    .array(
      z.object({ path: z.string().max(300), content: z.string().max(30_000) }),
    )
    .max(fileLimit),
});
export type CandidateInput = z.infer<typeof inputSchema>;
export type CandidateFile = { path: string; content: string };

export function validateCandidate(input: unknown): CandidateInput {
  const data = inputSchema.parse(input);
  if (new TextEncoder().encode(JSON.stringify(data)).byteLength > uploadLimit)
    throw new Error("자료 전체 크기는 1MB 이하여야 합니다.");
  if (data.publicProfile.candidateId !== data.privateProfile.candidateId)
    throw new Error("공개·비공개 프로필 ID가 다릅니다.");
  const declared = data.publicProfile.docs.map((doc) => doc.path);
  const paths = data.docs.map((doc) => doc.path);
  if (
    new Set(declared).size !== declared.length ||
    new Set(paths).size !== paths.length
  )
    throw new Error("중복된 문서 경로가 있습니다.");
  if (
    paths.length !== declared.length ||
    paths.some((path) => !declared.includes(path))
  )
    throw new Error("등록한 공개 문서와 업로드한 문서가 일치하지 않습니다.");
  const references = [
    ...data.publicProfile.skills,
    ...data.publicProfile.experience,
    ...data.publicProfile.transferableStrengths,
  ].flatMap((item) => item.evidence);
  for (const evidence of references) {
    if (!evidence.docPath) continue;
    const [file, anchor] = evidence.docPath.split("#");
    const source = data.docs.find((doc) => doc.path === file);
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
      throw new Error(`근거 문서 또는 앵커가 없습니다: ${evidence.docPath}`);
  }
  return data;
}

export function parseCandidateFiles(files: CandidateFile[]): CandidateInput {
  if (!files.length || files.length > fileLimit)
    throw new Error(`파일은 1~${fileLimit}개까지 선택할 수 있습니다.`);
  let total = 0;
  const paths = new Set<string>();
  for (const file of files) {
    total += new TextEncoder().encode(file.content).byteLength;
    if (total > uploadLimit)
      throw new Error("자료 전체 크기는 1MB 이하여야 합니다.");
    if (
      file.path.length > 500 ||
      file.path.includes("\\") ||
      file.path.includes(":") ||
      file.path
        .split("/")
        .some((part) => !part || part === "." || part === "..")
    )
      throw new Error("자료 폴더를 벗어나는 경로는 사용할 수 없습니다.");
    if (paths.has(file.path)) throw new Error("중복된 파일 이름이 있습니다.");
    paths.add(file.path);
  }
  const indexes = files.filter((file) => /(^|\/)index\.json$/.test(file.path));
  if (indexes.length !== 1)
    throw new Error("구직자 index.json이 하나 들어 있는 폴더를 선택해주세요.");
  const index = indexes[0];
  const prefix = index.path.slice(0, -"index.json".length);
  if (files.some((file) => !file.path.startsWith(prefix)))
    throw new Error("하나의 구직자 폴더만 선택해주세요.");
  let raw: unknown;
  try {
    raw = JSON.parse(index.content);
  } catch {
    throw new Error("index.json의 JSON 문법을 확인해주세요.");
  }
  const profile = candidateManifestSchema.parse(raw);
  const declared = [
    ...profile.publicProfile.docs,
    ...profile.privateProfile.docs,
  ].map((doc) => doc.path);
  if (
    files.some(
      (file) =>
        file !== index && !declared.includes(file.path.slice(prefix.length)),
    )
  )
    throw new Error(
      "index.json에 등록되지 않은 파일이 있습니다. 구직자 자료만 있는 폴더를 선택해주세요.",
    );
  for (const path of declared)
    if (!paths.has(prefix + path))
      throw new Error(`문서가 누락되었습니다: ${path}`);
  const docs = profile.publicProfile.docs.map((doc) => {
    const file = files.find((file) => file.path === prefix + doc.path);
    if (!file) throw new Error(`문서가 누락되었습니다: ${doc.path}`);
    return { path: doc.path, content: file.content };
  });
  return validateCandidate({ ...profile, docs });
}

export function inputError(error: unknown) {
  if (error instanceof z.ZodError)
    return `프로필 v1 형식을 확인해주세요: ${error.issues[0]?.path.join(".") || "index.json"}`;
  return error instanceof Error ? error.message : "자료를 읽지 못했습니다.";
}
