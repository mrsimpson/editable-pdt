import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { CANVASES, parseWorkspace } from "@pdt42/core";
import { expect, test } from "vite-plus/test";
import { EXAMPLES } from "../src/canvas-examples.ts";

const EXAMPLE = new URL("../../../examples/harvest-commons", import.meta.url).pathname;
const RENDERINGS = new URL("../../../demo/canvases", import.meta.url).pathname;
const ORIGINALS = new URL("../canvases/originals", import.meta.url).pathname;

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory()
      ? files(join(dir, d.name))
      : d.name.endsWith(".pdt42.md")
        ? [join(dir, d.name)]
        : [],
  );

const workspace = parseWorkspace(
  files(EXAMPLE).map((f) => ({ file: relative(EXAMPLE, f), content: readFileSync(f, "utf8") })),
);

test("the PDT canvases page covers every canvas with the example's own elements", () => {
  expect(Object.keys(EXAMPLES).sort()).toEqual(CANVASES.map((c) => c.id).sort());
  for (const [canvas, { view, element }] of Object.entries(EXAMPLES)) {
    expect(workspace.byId.has(element), `${canvas}: element ${element}`).toBe(true);
    if (!view) continue;
    expect(workspace.canvases.find((v) => v.id === view)?.canvas, `${canvas}: view ${view}`).toBe(
      canvas,
    );
    expect(
      existsSync(join(RENDERINGS, `${view}.png`)),
      `${canvas}: demo/canvases/${view}.png`,
    ).toBe(true);
  }
});

test("every original on the page is a known canvas", () => {
  const ids = new Set(CANVASES.map((c) => c.id));
  for (const file of readdirSync(ORIGINALS))
    expect(ids.has(file.replace(/\.webp$/, ""))).toBe(true);
});
