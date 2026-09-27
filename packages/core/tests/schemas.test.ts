import { describe, expect, test } from "vite-plus/test";
import {
  BLOCK_SCHEMAS,
  BLOCK_TYPES,
  blockFields,
  blockMeta,
  crossReferences,
  parseMarkdown,
  STEPS,
} from "../src/index.ts";

describe("schemas", () => {
  test("normalise references, lists and flags", () => {
    const r = BLOCK_SCHEMAS.relationship.parse({
      id: "r",
      title: "R",
      between: "a, b",
      core: "yes",
    });
    expect(r).toEqual({ id: "r", title: "R", between: ["a", "b"], core: true });
    const e = BLOCK_SCHEMAS.entity.parse({ id: "e", title: "E", clusters: "Only one" });
    expect(e.clusters).toEqual(["Only one"]);
    expect(e.pressures).toEqual([]);
  });

  test("reject bad enum values and out-of-range numbers", () => {
    expect(
      BLOCK_SCHEMAS.transaction.safeParse({
        id: "t",
        title: "T",
        from: "a",
        to: "b",
        direction: "sideways",
      }).success,
    ).toBe(false);
    expect(
      BLOCK_SCHEMAS.component.safeParse({ id: "c", title: "C", visibility: "140" }).success,
    ).toBe(false);
  });

  test("every block type names an existing step, has tips and a valid example", () => {
    for (const type of BLOCK_TYPES) {
      const meta = blockMeta(type);
      expect(
        STEPS.some((s) => s.id === meta.step),
        type,
      ).toBe(true);
      expect(meta.tips.length, type).toBeGreaterThan(0);
      const block = parseMarkdown(
        "example",
        `\`\`\`pdt42\n:::${type}\n${meta.example}\n:::\n\`\`\``,
      ).nodes.find((n) => n.kind === "block");
      const attributes = block?.kind === "block" ? block.attributes : {};
      expect(BLOCK_SCHEMAS[type].safeParse(attributes).success, `${type} example`).toBe(true);
    }
  });

  test("every reference field targets known block types", () => {
    for (const ref of crossReferences())
      for (const t of ref.to) expect(BLOCK_TYPES, `${ref.from}.${ref.field}`).toContain(t);
  });

  test("every field carries a description", () => {
    for (const type of BLOCK_TYPES)
      for (const f of blockFields(type)) expect(f.description, `${type}.${f.name}`).not.toBe("");
  });

  test("the meta-model is one connected graph", () => {
    const adjacent = new Map(BLOCK_TYPES.map((t) => [t as string, new Set<string>()]));
    for (const r of crossReferences())
      for (const t of r.to) {
        adjacent.get(r.from)!.add(t);
        adjacent.get(t)!.add(r.from);
      }
    const seen = new Set<string>(["platform"]);
    const stack = ["platform"];
    while (stack.length) {
      for (const n of adjacent.get(stack.pop()!)!) {
        if (seen.has(n)) continue;
        seen.add(n);
        stack.push(n);
      }
    }
    expect([...BLOCK_TYPES].filter((t) => !seen.has(t))).toEqual([]);
  });
});

test("docs/meta-model.md is up to date (run `pnpm docs:meta-model`)", async () => {
  const { readFileSync } = await import("node:fs");
  const { metaModelDoc } = await import("../src/index.ts");
  const doc = readFileSync(new URL("../../../docs/meta-model.md", import.meta.url), "utf8");
  expect(doc).toBe(`${metaModelDoc()}\n`);
});
