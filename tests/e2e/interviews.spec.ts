import { expect, test } from "@playwright/test";
import path from "node:path";
import { cp, readFile, writeFile } from "node:fs/promises";

test("자료 폴더로 시작한 1:N 면접은 화면을 닫아도 완료되고 기록을 복원한다", async ({ page, context, playwright }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto("http://127.0.0.1:3101");
  await page.getByRole("button", { name: "샘플로 체험하기" }).click();
  await expect(page.getByRole("status").filter({ hasText: "최신 온보딩 예시 프로필" })).toContainText("Multimodal AI Research Engineer");
  const folder = testInfo.outputPath("candidate");
  await cp(path.resolve("data/demo/candidates/onboarding-example"), folder, { recursive: true });
  const file = path.join(folder, "index.json");
  const candidate = JSON.parse(await readFile(file, "utf8"));
  candidate.publicProfile.headline = "업로드한 자동화 엔지니어";
  candidate.publicProfile.wants.roleTypes = ["Software Engineer"];
  candidate.publicProfile.candidateId = "uploaded-candidate-1";
  candidate.privateProfile.candidateId = "uploaded-candidate-1";
  await writeFile(file, JSON.stringify(candidate));
  await page.getByLabel("구직자 자료 폴더 선택").setInputFiles(folder);
  await expect(page.getByRole("heading", { level: 3, name: "업로드한 자동화 엔지니어" })).toBeVisible();
  await page.getByRole("checkbox", { name: "프로필과 희망 조건을 확인했으며 이 자료로 면접을 시작합니다." }).check();
  await page.getByLabel("검색 국가").selectOption("AU");
  await page.getByRole("button", { name: "면접 시작 ↗" }).click();
  await expect(page).toHaveURL(/run=wrun_/);
  const url = page.url();
  const runId = new URL(url).searchParams.get("run");
  const outsider = await playwright.request.newContext();
  expect((await outsider.get(`http://127.0.0.1:3101/api/runs/${runId}`)).status()).toBe(403);
  await outsider.dispose();
  await page.close();
  await expect.poll(async () => {
    const response = await context.request.get(`http://127.0.0.1:3101/api/runs/${runId}`);
    return (await response.json()).status;
  }, { timeout: 60_000 }).toBe("completed");
  const restored = await context.newPage();
  await restored.goto(url);
  await expect(restored.getByRole("button", { name: /stripe/i })).toContainText("확인 후 결정");
  await expect(restored.getByRole("heading", { level: 2, name: "업로드한 자동화 엔지니어" })).toBeVisible();
  await expect(restored.getByRole("log")).toContainText("업로드한 자동화 엔지니어");
  await expect(restored.getByRole("button", { name: /mongodb/i })).toContainText("확인 후 결정");
  await expect(restored.getByRole("link", { name: /공고 원문/ })).toHaveAttribute("href", /^https:\/\//);
  await expect(restored.getByText(/호주 · 일치 공고/)).toBeVisible();
  const events = await context.request.get(`http://127.0.0.1:3101/api/runs/${runId}?stream=1`);
  const log = await events.text();
  expect(log).toContain('"stage":"salary_check"');
  expect(log).toContain('"candidateId":"uploaded-candidate-1"');
  expect(log).not.toContain("floor");
  expect(log.match(/"type":"result"/g)).toHaveLength(2);
  await restored.screenshot({ path: "test-results/interviews-desktop.png", fullPage: true });
  await restored.setViewportSize({ width: 390, height: 844 });
  expect(await restored.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await restored.screenshot({ path: "test-results/interviews-mobile.png", fullPage: true });
});

test("면접 실행 API는 외부 출처의 시작 요청을 거부한다", async ({ request }) => {
  const response = await request.post("http://127.0.0.1:3101/api/runs", { headers: { Origin: "https://example.com" } });
  expect(response.status()).toBe(403);
});
