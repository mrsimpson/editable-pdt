import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;
const EXAMPLE = new URL("../../../examples/harvest-commons", import.meta.url).pathname;

function pdt(...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["--conditions=development", "--experimental-strip-types", "--no-warnings", CLI, ...args],
    {
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    },
  );
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe("pdt", () => {
  test("validate passes on the example and fails on errors", () => {
    expect(pdt("--dir", EXAMPLE, "validate")).toMatchObject({ code: 0 });
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    writeFileSync(
      join(dir, "x.pdt.md"),
      "## X\n\nProse.\n\n```pdt\n:::relationship\nid: r\ntitle: R\nbetween: a, b\n:::\n```\n",
    );
    const r = pdt("--dir", dir, "validate");
    expect(r.code).toBe(1);
    expect(r.out).toContain('E002 x.pdt.md:9  between: "a" does not exist');
  });

  test("guide and next start a blank workspace at D1; guide step hands out the template", () => {
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    expect(pdt("--dir", dir, "next").out).toContain("Next: D1 · Map the ecosystem");
    const overview = pdt("--dir", dir, "guide").out;
    expect(overview).toContain("[ ] D5  Identify the elementary transactions and channels");
    expect(overview).toContain(":::transaction, :::channel");
    const d5 = pdt("--dir", dir, "guide", "step", "D5").out;
    expect(d5).toContain("Write this step in `2-design/d5-transactions.pdt.md`");
    expect(d5).toContain(
      "- `:::entity` from D1 — required via transaction.from, transaction.to; none yet ← write these first",
    );
    expect(d5).toContain("- `pdt explain transaction`");
    expect(d5).toContain("## Starter template");
    expect(pdt("init").code).toBe(2);
  });

  test("guide step shows the brief and the step's findings", () => {
    const dir = mkdtempSync(join(tmpdir(), "pdt-"));
    writeFileSync(
      join(dir, "d.pdt.md"),
      "## Farmers\n\nThey grow.\n\n```pdt\n:::entity\nid: e-f\ntitle: Farmers\nrole: peer-producer\n:::\n```\n",
    );
    const out = pdt("--dir", dir, "guide", "step", "d2").out;
    expect(out).toContain("# D2 · Portray the entity-roles");
    expect(out).toContain("H104 hint d.pdt.md:6 — Farmers's portrait lacks");
  });

  test("explain, roles, canvas and rules render; json is parseable", () => {
    expect(pdt("explain", "entity").out).toContain("| `reach-gains` |");
    expect(pdt("guide", "roles").out).toContain("Peer producer** (PP");
    expect(pdt("guide", "canvas", "transactions-board").out).toContain("`transaction.value-unit`");
    expect(JSON.parse(pdt("rules", "--format", "json").out).length).toBeGreaterThan(30);
    expect(JSON.parse(pdt("--dir", EXAMPLE, "get", "--format", "json").out).length).toBe(90);
  });

  test("usage errors exit with 2", () => {
    expect(pdt("frobnicate").code).toBe(2);
    expect(pdt("guide", "step").code).toBe(2);
  });
});
