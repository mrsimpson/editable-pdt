// The demo scenario behind the site's screenshots: Harvest Commons in `pdt42 serve`, read by a
// human and extended by an agent. Every moment is saved to demo/ (and every canvas to
// demo/canvases/), which the site imports.
//
//   pnpm build && pnpm demo
//
// Playwright is not a dependency of the workspace: set PLAYWRIGHT_MODULE to its entry point if
// `playwright` cannot be imported (e.g. a global installation).

import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

type Page = {
  goto(url: string): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  screenshot(options: { path: string; fullPage?: boolean }): Promise<unknown>;
  locator(selector: string): {
    click(): Promise<void>;
    screenshot(options: { path: string }): Promise<unknown>;
    scrollIntoViewIfNeeded(): Promise<void>;
    first(): { click(): Promise<void> };
  };
  evaluate<T>(fn: () => T): Promise<T>;
  emulateMedia(options: { colorScheme: "light" | "dark" }): Promise<void>;
  on(event: "pageerror", listener: (error: Error) => void): void;
};
type Browser = {
  newPage(options: { viewport: { width: number; height: number } }): Promise<Page>;
  close(): Promise<void>;
};

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "demo");
const PORT = 4343;
const BASE = `http://127.0.0.1:${PORT}/`;

const D4 = "2-design/d4-relationships.pdt42.md";
const D5 = "2-design/d5-transactions.pdt42.md";

async function playwright(): Promise<{ chromium: { launch(): Promise<Browser> } }> {
  const entry = process.env.PLAYWRIGHT_MODULE ?? "playwright";
  const mod = (await import(entry)) as { default?: unknown; chromium?: unknown };
  return (mod.chromium ? mod : mod.default) as { chromium: { launch(): Promise<Browser> } };
}

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}api/workspace`)).ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error("pdt42 serve did not start");
}

async function main() {
  const work = await mkdtemp(join(tmpdir(), "pdt42-demo-"));
  await cp(join(ROOT, "examples/harvest-commons"), work, { recursive: true });
  await mkdir(join(OUT, "canvases"), { recursive: true });

  const server = spawn(
    process.execPath,
    [
      "--conditions=development",
      "--experimental-strip-types",
      "--no-warnings",
      join(ROOT, "packages/cli/src/cli.ts"),
      "--dir",
      work,
      "serve",
      "--port",
      String(PORT),
    ],
    { stdio: "inherit" },
  );

  const { chromium } = await playwright();
  const browser = await chromium.launch();
  try {
    await waitForServer();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const shot = async (name: string) => {
      await page.waitForTimeout(350);
      await page.screenshot({ path: join(OUT, `${name}.png`) });
      console.log(`  ${name}.png`);
    };
    // A fresh page for every moment: nothing left open from the moment before.
    const open = async (hash: string) => {
      await page.goto("about:blank");
      await page.goto(`${BASE}#${hash}`);
      await page.waitForTimeout(300);
    };

    console.log("Reading the design");
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
    await page.locator('.toggle__option:has-text("Agent")').click();
    await shot("06-agent-view");
    await page.locator('.toggle__option:has-text("Human")').click();

    console.log("Every canvas");
    const payload = (await (await fetch(`${BASE}api/workspace`)).json()) as {
      canvases: { id: string; loc: { file: string } }[];
    };
    for (const c of payload.canvases) {
      await open(`${c.loc.file}:${c.id}`);
      await page
        .locator(`[id="${c.id}"]`)
        .screenshot({ path: join(OUT, "canvases", `${c.id}.png`) });
    }
    console.log(`  ${payload.canvases.length} canvases`);

    console.log("The agent adds a relationship");
    const d4 = await readFile(join(work, D4), "utf8");
    await writeFile(
      join(work, D4),
      d4 +
        [
          "",
          "## Artisan ↔ household",
          "",
          "Artisans add bread and cheese to the weekly box; households pick the extras they want.",
          "",
          "```pdt42",
          ":::relationship",
          "id: r-artisan-household",
          "title: Artisan ↔ household",
          "between: e-artisans, e-households",
          ":::",
          "```",
          "",
        ].join("\n"),
    );
    const d5 = await readFile(join(work, D5), "utf8");
    const transaction = [
      "",
      "### Add extras to the box",
      "",
      "Households tick the bread and cheese they want; the artisan bakes to order.",
      "",
      "```pdt42",
      ":::transaction",
      "id: t-box-extras",
      "title: Add extras to the box",
      "relationship: r-artisan-household",
      "from: e-artisans",
      "to: e-households",
      "value-unit: Extras per box",
      "happening: no",
      "channel: ch-app",
      "kind: goods",
      ":::",
      "```",
      "",
    ].join("\n");
    await writeFile(join(work, D5), `${d5}\n## Artisan ↔ household\n${transaction}`);
    await sleep(900);
    await open(D5);
    await shot("07-canvas-missing");

    console.log("…and places its board");
    const board = [
      "",
      "```pdt42",
      ":::canvas",
      "id: cv-board-extras",
      "canvas: transactions-board",
      "of: r-artisan-household",
      ":::",
      "```",
    ].join("\n");
    await writeFile(join(work, D5), `${d5}\n## Artisan ↔ household\n${board}\n${transaction}`);
    await sleep(900);
    await open(`${D5}:cv-board-extras`);
    await shot("08-canvas-placed");

    console.log("Growth, in the dark");
    await page.emulateMedia({ colorScheme: "dark" });
    await open("3-growth/g3-flywheels.pdt42.md:cv-flywheels");
    await shot("09-dark-flywheels");
    await page.emulateMedia({ colorScheme: "light" });

    if (errors.length) throw new Error(`Errors in the page:\n${errors.join("\n")}`);
  } finally {
    await browser.close();
    server.kill();
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
