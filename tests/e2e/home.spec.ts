import { expect, test } from "@playwright/test";

test("환경변수 없이도 기본 화면을 제공한다", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Anthropic 해커톤 보일러플레이트");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Anthropic 해커톤 보일러플레이트",
    }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});
