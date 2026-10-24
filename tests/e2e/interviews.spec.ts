import { expect, test } from "@playwright/test";

test("화면을 닫아도 1:N 면접이 완료되고 같은 브라우저에서 기록을 복원한다", async ({ page, context, playwright }) => {
  test.setTimeout(90_000);
  await page.goto("http://127.0.0.1:3101");
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
  await expect(restored.getByRole("button", { name: /Orbit Works/ })).toContainText("대면 면접 추천");
  await expect(restored.getByRole("button", { name: /Relay Studio/ })).toContainText("확인 후 결정");
  await restored.getByRole("button", { name: /Relay Studio/ }).click();
  await expect(restored.getByText("출장이 필요한지 확인해주세요.")).toBeVisible();
  const events = await context.request.get(`http://127.0.0.1:3101/api/runs/${runId}?stream=1`);
  const log = await events.text();
  expect(log).toContain('"stage":"salary"');
  expect(log).not.toContain("90000");
  expect(log).not.toContain("floor");
  expect(log.match(/"type":"result"/g)).toHaveLength(2);
  await restored.setViewportSize({ width: 390, height: 844 });
  expect(await restored.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await restored.screenshot({ path: "test-results/interviews-mobile.png", fullPage: true });
});

test("면접 실행 API는 외부 출처의 시작 요청을 거부한다", async ({ request }) => {
  const response = await request.post("http://127.0.0.1:3101/api/runs", { headers: { Origin: "https://example.com" } });
  expect(response.status()).toBe(403);
});
