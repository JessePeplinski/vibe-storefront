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
    page.getByRole("heading", {
      level: 2,
      name: "Sign in to generate storefronts"
    })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in to generate" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /browse examples/i }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /why generation requires sign-in/i })
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

  await page.goto(new URL("/deck", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator(".reveal")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Vibe Storefront" })
  ).toBeVisible();
});

test("public share page renders from the gallery when storefronts exist", async ({
  page
}) => {
  await page.goto(new URL("/storefronts", baseUrl).toString(), {
    waitUntil: "domcontentloaded"
  });

  const openStorefrontLinks = page.getByRole("link", {
    name: "Open storefront"
  });

  test.skip(
    (await openStorefrontLinks.count()) === 0,
    "No public storefront records are available for share-page smoke coverage."
  );

  await openStorefrontLinks.first().click();

  await expect(page).toHaveURL(/\/s\/[^/]+$/);
  await expect(page.locator("main article")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Built with vibe-storefront.com" })
  ).toBeVisible();
  await expect(
    page.locator("main article footer").getByText(/Source prompt:/i)
  ).toBeVisible();
});
