import { expect, test } from "@playwright/test";

for (const [title, url] of [
  ["구직자 온보딩", "http://127.0.0.1:3100"],
  ["에이전트 면접", "http://127.0.0.1:3101"],
]) {
  test(`${title} 앱이 환경변수 없이 기본 화면을 제공한다`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${title} | cgbg-project`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  });
}
