import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  PAUSE_LONG,
  PAUSE_MED,
  PAUSE_SHORT,
  caption,
  centerAndClick,
  injectCaption,
  injectCursorOverlay,
} from "./demo-helpers.ts";
import {
  D4,
  D5,
  DEMO,
  NEW_BOARD,
  NEW_RELATIONSHIP,
  NEW_TRANSACTION,
  startDemoServer,
} from "./demo-fixtures.ts";

// The demo behind the landing page — not a functional test. A human reads Harvest Commons in
// `pdt42 serve`, then an agent extends it. The walkthrough is recorded (demo/demo.webm); the
// second test takes the site's screenshots (demo/*.png, demo/canvases/*.png).
//
//   pnpm build && pnpm demo

const READ = 3200;

async function scrollTo(page: Page, selector: string, pause = PAUSE_SHORT) {
  await page
    .locator(selector)
    .first()
    .evaluate((element) =>
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 24,
        behavior: "smooth",
      }),
    );
  await page.waitForTimeout(pause);
}

test("walkthrough — reading and extending Harvest Commons", async ({ page }) => {
  const server = await startDemoServer(4344);
  try {
    await page.goto(`${server.url}#1-exploration/e1-arenas.pdt42.md`);
    await page.locator("h1").first().waitFor();
    await injectCursorOverlay(page);
    await injectCaption(page);
    await caption(
      page,
      "A platform design in pdt42 — one Markdown chapter per step of the Platform Design Toolkit",
      READ,
    );
    await scrollTo(page, "#cv-arena-scan", PAUSE_SHORT);
    await caption(page, "Every chapter shows its canvas, drawn from the model", READ);

    // The ecosystem, and a sticky that leads to its element
    await centerAndClick(page, page.locator(".nav__link", { hasText: "Map the ecosystem" }));
    await scrollTo(page, "#cv-ecosystem", PAUSE_SHORT);
    await caption(page, "The ecosystem: the platform's roles as rings around its owner", READ);
    await caption(page, "Every sticky is an element of the model — click one", PAUSE_MED);
    await centerAndClick(page, page.locator('#cv-ecosystem .sticky[data-ref="e-farmers"]'));
    await expect(page.locator('section.card[data-element="e-farmers"]')).toBeVisible();
    await caption(
      page,
      "Its model box: the attributes, who refers to it, every canvas it appears on",
      READ + PAUSE_MED,
    );
    await centerAndClick(
      page,
      page.locator('section.card[data-element="e-farmers"] .card__stripe--button'),
    );
    await caption(page, "One click on the stripe and it is prose again", READ);

    // Transactions, and the agent's view
    await centerAndClick(page, page.locator(".nav__link", { hasText: "elementary transactions" }));
    await scrollTo(page, "#cv-board-restaurant", PAUSE_SHORT);
    await caption(page, "The transactions board of the core relationship", READ);
    await centerAndClick(page, page.locator(".toggle__option", { hasText: "Agent" }));
    await caption(page, "The agent view: the source your agent reads and writes", READ);
    await centerAndClick(page, page.locator(".toggle__option", { hasText: "Human" }));

    // The agent extends the design
    await caption(page, "Your agent adds a relationship and its first transaction …", PAUSE_LONG);
    const d5 = server.read(D5);
    server.write(D4, server.read(D4) + NEW_RELATIONSHIP);
    server.write(D5, `${d5}\n## Artisan ↔ household\n${NEW_TRANSACTION}`);
    await expect(page.locator(".finding code", { hasText: "W011" }).first()).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(PAUSE_SHORT);
    await caption(page, "… and pdt42 asks for the chapter's canvas", READ + PAUSE_MED);
    server.write(D5, `${d5}\n## Artisan ↔ household\n${NEW_BOARD}\n${NEW_TRANSACTION}`);
    await page.locator("#cv-board-extras").waitFor();
    await scrollTo(page, "#cv-board-extras", PAUSE_SHORT);
    await caption(page, "Placed — and drawn from the model, consistent by construction", READ);

    // Growth, in the dark
    await centerAndClick(page, page.locator(".icon-button[aria-label='Toggle theme']"));
    await centerAndClick(page, page.locator(".nav__link", { hasText: "Sketch the flywheels" }));
    await scrollTo(page, "#cv-flywheels", PAUSE_SHORT);
    await caption(page, "Innovation stays human. pdt42 keeps it consistent.", READ + PAUSE_MED);
  } finally {
    server.stop();
  }
  const video = page.video();
  await page.close();
  if (video) {
    mkdirSync(DEMO, { recursive: true });
    copyFileSync(await video.path(), join(DEMO, "demo.webm"));
  }
});

test("screenshots for the site", async ({ page }) => {
  const server = await startDemoServer(4345);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  mkdirSync(join(DEMO, "canvases"), { recursive: true });
  const shot = async (name: string) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(DEMO, `${name}.png`) });
  };
  // A fresh page for every moment: nothing left open from the moment before.
  const open = async (hash: string) => {
    await page.goto("about:blank");
    await page.goto(`${server.url}#${hash}`);
    await page.locator("h1").first().waitFor();
    await page.waitForTimeout(300);
  };
  try {
    await open("1-exploration/e1-arenas.pdt42.md");
    await shot("01-chapter");
    await open("2-design/d1-ecosystem.pdt42.md:cv-ecosystem");
    await shot("02-ecosystem-canvas");
    await open("2-design/d1-ecosystem.pdt42.md:el-e-farmers");
    await shot("03-model-box");
    await open(`${D5}:cv-board-restaurant`);
    await shot("04-transactions-board");
    await page.locator('#cv-board-restaurant .sticky[data-ref="t-share-menus"]').click();
    await shot("05-sticky-to-element");
    await page.locator(".toggle__option", { hasText: "Agent" }).click();
    await shot("06-agent-view");

    // Every canvas of the example, before the agent's edit
    const payload = (await (await fetch(`${server.url}api/workspace`)).json()) as {
      canvases: { id: string; loc: { file: string } }[];
    };
    for (const c of payload.canvases) {
      await open(`${c.loc.file}:${c.id}`);
      await page.locator(`[id="${c.id}"]`).screenshot({
        path: join(DEMO, "canvases", `${c.id}.png`),
      });
    }

    const d5 = server.read(D5);
    server.write(D4, server.read(D4) + NEW_RELATIONSHIP);
    server.write(D5, `${d5}\n## Artisan ↔ household\n${NEW_TRANSACTION}`);
    await page.waitForTimeout(900);
    await open(D5);
    await expect(page.locator(".finding code", { hasText: "W011" }).first()).toBeVisible();
    await shot("07-canvas-missing");
    server.write(D5, `${d5}\n## Artisan ↔ household\n${NEW_BOARD}\n${NEW_TRANSACTION}`);
    await page.waitForTimeout(900);
    await open(`${D5}:cv-board-extras`);
    await shot("08-canvas-placed");

    await page.emulateMedia({ colorScheme: "dark" });
    await open("3-growth/g3-flywheels.pdt42.md:cv-flywheels");
    await shot("09-dark-flywheels");
  } finally {
    server.stop();
  }
  expect(errors).toEqual([]);
});
