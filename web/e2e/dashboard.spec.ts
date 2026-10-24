import { test, expect } from "@playwright/test";
import demoReport from "../../examples/demo-report.json" with { type: "json" };
import { connectedReport } from "../src/test/connectedReport";
const routes = [
  "/",
  "/search",
  "/keywords",
  "/content",
  "/aeo",
  "/tracker",
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
// Demo interactions use explicit fixtures even when the shipped snapshot is real.
test.beforeEach(async ({ page }) => {
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({ json: { workflow_runs: [] } }),
  );
  await page.route("**/data/report.json", (route) =>
    route.fulfill({ json: demoReport }),
  );
});
test("agent status follows GitHub and retains the last published report after failure", async ({
  page,
}, testInfo) => {
  const report = connectedReport();
  let running = true;
  await page.route("**/data/report.json", (route) =>
    route.fulfill({ json: report }),
  );
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      json: {
        workflow_runs: [
          {
            id: 123,
            head_branch: "main",
            event: "workflow_dispatch",
            head_repository: { full_name: "Vikasyadav25/website-seo" },
            status: running ? "in_progress" : "completed",
            conclusion: running ? null : "failure",
            created_at: report.generatedAt,
            updated_at: report.generatedAt,
          },
        ],
      },
    }),
  );
  await page.goto("#/");
  await expect(
    page.getByRole("heading", { name: "Audit running now" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Run audit in GitHub" }),
  ).toHaveAttribute("href", /daily-audit.yml$/);
  await expect(
    page.getByRole("link", { name: "Product SEO", exact: true }),
  ).not.toBeVisible();
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByText("More tools", { exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Product SEO", exact: true }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile")
    await page.locator(".mobile-close").click();
  await page.getByText("What the agent checked", { exact: true }).click();
  await expect(page.getByText(/Checked 2 HTML pages/)).toBeVisible();
  await page.screenshot({
    path: `private/agent-${testInfo.project.name}.png`,
    fullPage: true,
  });
  running = false;
  await page.getByRole("button", { name: "Refresh published report" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Latest audit did not complete successfully",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Last published audit" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("GitHub rate limits show unknown current activity without hiding report evidence", async ({
  page,
}) => {
  await page.route("**/data/report.json", (route) =>
    route.fulfill({ json: connectedReport() }),
  );
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({ status: 429, json: {} }),
  );
  await page.goto("#/");
  await expect(
    page.getByRole("heading", { name: "Current agent activity unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Last published audit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Audit running now" }),
  ).toHaveCount(0);
});
test("content agent exposes real assisted outputs without claiming publication", async ({
  page,
}) => {
  await page.goto("#/content");
  await expect(
    page.getByRole("heading", {
      name: "925 silver jewellery care guide",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".notice").filter({ hasText: "Assisted content run" }),
  ).toBeVisible();
  await expect(page.locator(".content-stages li")).toHaveCount(6);
  await expect(page.locator(".content-images img")).toHaveCount(2);
  for (const image of await page.locator(".content-images img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (node) =>
            (node as HTMLImageElement).complete &&
            (node as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await expect(
    page.getByRole("button", { name: "Store publication unavailable" }),
  ).toBeDisabled();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download article draft" }).click();
  expect((await downloading).suggestedFilename()).toBe(
    "925-silver-jewellery-care-guide.md",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("production report shows real activity, measurements and crawl findings", async ({
  page,
}) => {
  await page.route("**/data/report.json", (route) =>
    route.fulfill({ json: connectedReport() }),
  );
  await page.goto("#/");
  await expect(page.getByText("Last published audit")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What to work on first" }),
  ).toBeVisible();
  await expect(page.locator(".welcome-art")).toHaveCount(0);
  await expect(page.locator(".environment-tag")).toHaveText("PARTIAL");
  await expect(
    page.getByText("Technical findings", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("First measured baseline recorded")).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("#/technical");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Inspect" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "No nonempty meta description detected.",
  );
  await page.keyboard.press("Escape");
  await page.goto("#/aeo");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Description absent");
  await expect(page.locator("tbody tr")).toContainText("Not detected");
});
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
