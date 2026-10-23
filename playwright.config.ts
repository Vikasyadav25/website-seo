import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./web/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173/website-seo/",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview --port 4173 --strictPort",
    env: { PAGES_BASE_PATH: "/website-seo/" },
    url: "http://127.0.0.1:4173/website-seo/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } },
    },
  ],
});
