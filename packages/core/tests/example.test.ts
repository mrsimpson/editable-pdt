import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import {
  nextStep,
  parseWorkspace,
  progress,
  starterTemplate,
  stepById,
  stepDependencies,
  STEPS,
  validate,
} from "../src/index.ts";

const ROOT = new URL("../../../examples/harvest-commons/", import.meta.url).pathname;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".pdt42.md") ? [path] : [];
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

describe("step guidance", () => {
  test("starter templates hold no model elements", () => {
    const fresh = parseWorkspace(
      STEPS.map((s) => ({ file: `${s.id}.pdt42.md`, content: starterTemplate(s.id) })),
    );
    expect(fresh.elements).toEqual([]);
    expect(validate(fresh)).toEqual([]);
    expect(nextStep(progress(fresh, []))?.status.step.id).toBe("D1");
  });

  test("the examples inside every template are valid blocks", () => {
    for (const step of STEPS) {
      const uncommented = starterTemplate(step.id).replace(/<!--|-->/g, "");
      const ws = parseWorkspace([{ file: "t.pdt42.md", content: uncommented }]);
      expect(ws.issues, step.id).toEqual([]);
      expect(ws.elements.length, step.id).toBeGreaterThan(0);
    }
  });

  test("dependencies point to earlier steps for required references", () => {
    const d5 = stepDependencies(stepById("D5")!);
    expect(d5.find((d) => d.type === "entity")).toMatchObject({ step: "D1", required: true });
    expect(d5.find((d) => d.type === "relationship")).toMatchObject({
      step: "D4",
      required: false,
    });
    const order = (id: string) => STEPS.findIndex((s) => s.id === id);
    for (const step of STEPS) {
      for (const dep of stepDependencies(step).filter((d) => d.required)) {
        expect(order(dep.step), `${step.id} requires ${dep.type}`).toBeLessThan(order(step.id));
      }
    }
  });
});
