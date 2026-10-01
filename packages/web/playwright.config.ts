import { defineConfig, devices } from "@playwright/test";

// Functional tests of the web view (`pnpm test:e2e`, after `pnpm build`), and the demo: a screen
// recording and the screenshots for the site (`pnpm demo`).

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true },
      testMatch: ["**/serve-ui.spec.ts"],
    },
    {
      name: "demo",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        video: { mode: "on", size: { width: 1280, height: 800 } },
        viewport: { width: 1280, height: 800 },
      },
      testMatch: ["**/demo.spec.ts"],
      timeout: 180000,
    },
  ],
});
