import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import {
  nextStep,
  parseWorkspace,
  progress,
  starterTemplate,
  STEPS,
  validate,
} from "../src/index.ts";

const ROOT = new URL("../../../examples/harvest-commons/", import.meta.url).pathname;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".pdt.md") ? [path] : [];
  });
}

describe("Harvest Commons example", () => {
  const ws = parseWorkspace(
    files(ROOT).map((path) => ({
      file: relative(ROOT, path),
      content: readFileSync(path, "utf8"),
    })),
  );
  const diagnostics = validate(ws);

  test("is free of findings", () => {
    expect(diagnostics).toEqual([]);
  });

  test("covers every step of the methodology", () => {
    expect(
      progress(ws, diagnostics)
        .filter((s) => s.state !== "done")
        .map((s) => s.step.id),
    ).toEqual([]);
    expect(nextStep(progress(ws, diagnostics))).toBeUndefined();
  });

  test("uses every block type", () => {
    const used = new Set(ws.elements.map((e) => e.kind));
    for (const step of STEPS) for (const type of step.blocks) expect(used, type).toContain(type);
  });
});

describe("starter templates", () => {
  test("hold no model elements, so a fresh workspace starts at the beginning", () => {
    const fresh = parseWorkspace(
      [...new Set(STEPS.map((s) => s.file))].map((file) => ({
        file,
        content: starterTemplate(file),
      })),
    );
    expect(fresh.elements).toEqual([]);
    expect(validate(fresh)).toEqual([]);
    expect(nextStep(progress(fresh, []))?.status.step.id).toBe("D1");
  });
});
