import { spawn, type ChildProcess } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// A scratch copy of Harvest Commons in `pdt42 serve`, so the demo can edit it like an agent would.

export const ROOT = resolve(import.meta.dirname, "../../..");
export const DEMO = join(ROOT, "demo");

export interface DemoServer {
  url: string;
  dir: string;
  /** Replace a chapter's content (the server announces the change to the page). */
  write(file: string, content: string): void;
  read(file: string): string;
  stop(): void;
}

export async function startDemoServer(port: number): Promise<DemoServer> {
  const dir = mkdtempSync(join(tmpdir(), "pdt42-demo-"));
  cpSync(join(ROOT, "examples/harvest-commons"), dir, { recursive: true });
  const server: ChildProcess = spawn(
    process.execPath,
    [
      "--conditions=development",
      "--experimental-strip-types",
      "--no-warnings",
      join(ROOT, "packages/cli/src/cli.ts"),
      "--dir",
      dir,
      "serve",
      "--port",
      String(port),
    ],
    { stdio: "ignore" },
  );
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${url}api/workspace`)).ok) break;
    } catch {
      // not up yet
    }
    if (i > 50) throw new Error("pdt42 serve did not start");
    await new Promise((ok) => setTimeout(ok, 200));
  }
  return {
    url,
    dir,
    write: (file, content) => writeFileSync(join(dir, file), content),
    read: (file) => readFileSync(join(dir, file), "utf8"),
    stop() {
      server.kill();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// ─── The agent's edit: a new relationship and its first transaction ──────────

export const D4 = "2-design/d4-relationships.pdt42.md";
export const D5 = "2-design/d5-transactions.pdt42.md";

export const NEW_RELATIONSHIP = [
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
].join("\n");

export const NEW_TRANSACTION = [
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

export const NEW_BOARD = [
  "",
  "```pdt42",
  ":::canvas",
  "id: cv-board-extras",
  "canvas: transactions-board",
  "of: r-artisan-household",
  ":::",
  "```",
].join("\n");
