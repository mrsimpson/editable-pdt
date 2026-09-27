import { defineConfig, devices } from "@playwright/test";

// Only the demo lives here for now: a screen recording and the screenshots for the site, not
// functional tests. Run with `pnpm demo` (after `pnpm build`).

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  projects: [
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
