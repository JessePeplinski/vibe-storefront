import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

test("public pages render primary UI", async ({ page }) => {
  await page.goto(new URL("/", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Validate product ideas with a storefront."
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /see all storefronts/i }).first()
  ).toBeVisible();

  await page.goto(new URL("/storefronts", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(
    page.getByRole("heading", { level: 1, name: "All storefronts" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Generate storefront" })
  ).toBeVisible();
});
