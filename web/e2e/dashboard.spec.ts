import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/search",
  "/keywords",
  "/products",
  "/technical",
  "/geo",
  "/competitors",
  "/recommendations",
  "/approvals",
  "/publishing",
  "/reports",
  "/settings",
];
test("all routes load on a GitHub Pages project subpath", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    await page.goto(`#${route}`);
    await expect(page.locator(".environment-tag")).toHaveText("DEMO");
    await expect(page.locator("h1")).toBeVisible();
    if (route === "/")
      await page.screenshot({
        path: `private/overview-${testInfo.project.name}.png`,
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("product drawer and before/after preview are accessible", async ({
  page,
}) => {
  await page.goto("#/products");
  await page.getByRole("button", { name: "View details" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Before", { exact: true })).toBeVisible();
  await expect(page.getByText("Proposed", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("proposal deep links show exact diff with publishing disabled", async ({
  page,
}) => {
  await page.goto("#/recommendations?proposal=DEMO-P001");
  await expect(page.getByRole("dialog")).toContainText("seo.description");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Review on GitHub" }),
  ).toBeDisabled();
});
test("date selection changes chart and reports can be exported", async ({
  page,
}) => {
  await page.goto("#/");
  await page.getByLabel("Reporting window").selectOption("7");
  await expect(page.locator("svg desc")).toContainText("7 daily observations");
  await page.goto("#/reports");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download public JSON" }).click();
  expect((await downloading).suggestedFilename()).toBe(
    "ratniva-demo-public-report.json",
  );
});
test("issue search, severity and sort work", async ({ page }) => {
  await page.goto("#/technical");
  await page.getByLabel("Filter severity").selectOption("high");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("Search issues").fill("canonical");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Sort issues").selectOption("category");
  await page.getByRole("button", { name: "Inspect" }).click();
  await expect(page.getByRole("dialog")).toContainText("Evidence");
});
