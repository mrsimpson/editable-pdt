// `pdt42 diff`, and the history `serve` and `build --with-history` deliver: the change of a
// workspace in Git, as every *42 language reports and shows it.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;
const EXAMPLE = new URL("../../../examples/harvest-commons", import.meta.url).pathname;
const MOTIVATIONS = "2-design/d3-motivations.pdt42.md";

function pdt(env: Record<string, string>, ...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["--conditions=development", "--experimental-strip-types", "--no-warnings", CLI, ...args],
    { encoding: "utf8", env: { ...process.env, NO_COLOR: "1", ...env } },
  );
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function git(dir: string, ...args: string[]) {
  return execFileSync(
    "git",
    ["-C", dir, "-c", "user.name=Ann", "-c", "user.email=ann@example.org", ...args],
    { encoding: "utf8" },
  );
}

/** A repository holding the example in `ws/`, committed once, then changed (uncommitted). */
function repository() {
  const root = mkdtempSync(join(tmpdir(), "pdt42-git-"));
  const ws = join(root, "ws");
  cpSync(EXAMPLE, ws, { recursive: true });
  git(root, "init", "-q");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "Harvest Commons");
  const file = join(ws, MOTIVATIONS);
  writeFileSync(file, readFileSync(file, "utf8").replace("status: potential", "status: current"));
  return { root, ws };
}

describe("pdt42 diff", () => {
  test("reports a block changed without its prose, until the change is accepted", () => {
    const { root, ws } = repository();
    const r = pdt({}, "--dir", ws, "diff");
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      `warning ${MOTIVATIONS}:20  Block 'm-farmers-restaurants' changed without changing its section prose.`,
    );
    const head = git(root, "rev-parse", "HEAD").trim();
    expect(r.err).toContain(`PDT42_CONSISTENT=${head}`);
    const accepted = pdt({ PDT42_CONSISTENT: head }, "--dir", ws, "diff");
    expect(accepted.code).toBe(0);
    expect(accepted.out).toContain("accepted as intentional");
  });

  test("--format json carries the semantic diff", () => {
    const { ws } = repository();
    const json = JSON.parse(pdt({}, "--dir", ws, "diff", "--format", "json").out) as {
      model: { elements: Array<{ id: string; status: string; attributes: unknown[] }> };
    };
    expect(json.model.elements).toEqual([
      expect.objectContaining({
        id: "m-farmers-restaurants",
        status: "modified",
        attributes: [{ name: "status", before: "potential", after: "current" }],
      }),
    ]);
  });
});

describe("history", () => {
  test("build --with-history writes the pearls, entries and snapshots of the workspace", () => {
    const { root, ws } = repository();
    git(root, "commit", "-qam", "Farmers deliver to restaurants now");
    const web = mkdtempSync(join(tmpdir(), "pdt42-web-"));
    writeFileSync(join(web, "index.html"), '<html><head><meta charset="UTF-8" /></head></html>');
    const out = mkdtempSync(join(tmpdir(), "pdt42-site-"));
    const r = pdt({ PDT42_WEB_DIR: web }, "--dir", ws, "build", "--out", out, "--with-history");
    expect(r.code).toBe(0);
    const pearls = readFileSync(join(out, "history", "index.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { subject: string });
    expect(pearls.map((p) => p.subject)).toEqual([
      "Farmers deliver to restaurants now",
      "Harvest Commons",
    ]);
    const entries = readFileSync(join(out, "history", "chunk-0.jsonl"), "utf8")
      .trim()
      .split("\n");
    expect(JSON.parse(entries[0]!)).toMatchObject({ semantic: true, modified: 1, added: 0 });
    const tree = JSON.parse(
      readFileSync(
        join(out, "history", "tree", readdirSync(join(out, "history", "tree"))[0]!),
        "utf8",
      ),
    ) as { files: Record<string, string> };
    expect(Object.keys(tree.files)).toContain(MOTIVATIONS);
    expect(readFileSync(join(out, "index.html"), "utf8")).toContain(
      'window.__HISTORY__={"base":"history/"}',
    );
  });

  test("build --diff injects the difference; the workspace is its head", () => {
    const { ws } = repository();
    const web = mkdtempSync(join(tmpdir(), "pdt42-web-"));
    writeFileSync(join(web, "index.html"), '<html><head><meta charset="UTF-8" /></head></html>');
    const out = mkdtempSync(join(tmpdir(), "pdt42-site-"));
    expect(pdt({ PDT42_WEB_DIR: web }, "--dir", ws, "build", "--out", out, "--diff").code).toBe(0);
    const html = readFileSync(join(out, "index.html"), "utf8");
    expect(html).toContain("window.__DIFF__=");
    expect(html).toContain('"label":"working tree"');
  });
});
