import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  buildWorkspace,
  parseMarkdown,
  progress,
  toPayload,
  validate,
  type AstNode,
} from "@pdt42/core";
import { parseHash } from "../src/App.tsx";
import { blockSource, groupNodes } from "../src/DocumentView.tsx";
import { renderMarkdown, slug } from "../src/markdown.ts";
import { WorkspaceIndex } from "../src/workspace.ts";

const EXAMPLE = join(import.meta.dirname, "../../../examples/harvest-commons");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return name.endsWith(".pdt42.md") ? [path] : [];
  });
}

function examplePayload() {
  const docs = files(EXAMPLE).map((path) =>
    parseMarkdown(relative(EXAMPLE, path), readFileSync(path, "utf8")),
  );
  const ws = buildWorkspace(docs);
  const diagnostics = validate(ws);
  return toPayload(ws, diagnostics, progress(ws, diagnostics));
}

describe("markdown", () => {
  it("renders paragraphs, marks, lists and tables", () => {
    const html = renderMarkdown(
      "A **bold** and *soft* `code` [link](https://example.org).\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |",
    );
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>soft</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain('<a href="https://example.org">link</a>');
    expect(html).toMatch(/<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
    expect(html).toContain("<td>2</td>");
  });

  it("escapes HTML and refuses unsafe links", () => {
    const html = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1)) "q"');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain("&lt;script&gt;");
  });

  it("slugs headings", () => {
    expect(slug("Farmer ↔ restaurant")).toBe("farmer-restaurant");
    expect(slug("Café hubs")).toBe("cafe-hubs");
  });
});

describe("document grouping", () => {
  const nodes = parseMarkdown(
    "x.pdt42.md",
    [
      "# Chapter",
      "",
      "Prose about the farmers.",
      "",
      "```pdt42",
      ":::ignore H002 on purpose :::",
      ":::entity",
      "id: e-farmers",
      "title: Farmers",
      "clusters:",
      "  - Growers",
      ":::",
      "```",
      "",
      "```pdt42",
      ":::canvas",
      "id: cv-eco",
      "canvas: ecosystem",
      ":::",
      "```",
      "",
      "Closing words.",
    ].join("\n"),
  ).nodes as AstNode[];

  it("attaches the prose before an element, and its ignores, to the element", () => {
    const groups = groupNodes(nodes);
    const run = groups.find((g) => g.kind === "run" && g.block);
    expect(run).toMatchObject({ kind: "run", prose: "Prose about the farmers." });
    expect(run?.kind === "run" && run.ignores.map((i) => i.ruleCode)).toEqual(["H002"]);
  });

  it("keeps canvases out of prose runs", () => {
    const groups = groupNodes(nodes);
    const canvas = groups.find((g) => g.kind === "node" && g.node.kind === "block");
    expect(canvas).toBeDefined();
    expect(groups.at(-1)).toMatchObject({ kind: "run", prose: "Closing words.", block: null });
  });

  it("prints a block back as source for the agent view", () => {
    const block = nodes.find((n) => n.kind === "block" && n.blockType === "entity");
    expect(block?.kind === "block" && blockSource(block)).toBe(
      ":::entity\nid: e-farmers\ntitle: Farmers\nclusters:\n  - Growers\n:::",
    );
  });
});

describe("routing", () => {
  it("splits file and anchor at the first colon", () => {
    expect(parseHash("#2-design/d5-transactions.pdt42.md:el-t-share-menus")).toEqual({
      file: "2-design/d5-transactions.pdt42.md",
      anchor: "el-t-share-menus",
    });
    expect(parseHash("#1-exploration/e1-arenas.pdt42.md")).toEqual({
      file: "1-exploration/e1-arenas.pdt42.md",
      anchor: null,
    });
    expect(parseHash("")).toEqual({ file: "", anchor: null });
  });
});

describe("workspace index (Harvest Commons)", () => {
  const ix = new WorkspaceIndex(examplePayload());

  it("draws every placed canvas", () => {
    expect(ix.canvases.size).toBe(28);
    for (const drawn of ix.canvases.values()) expect(drawn.model).toBeDefined();
  });

  it("knows which canvases each element appears on", () => {
    const onCanvases = (id: string) => (ix.canvasesOf.get(id) ?? []).map((v) => v.id);
    expect(onCanvases("e-farmers")).toContain("cv-ecosystem");
    expect(onCanvases("e-farmers")).toContain("cv-portrait-farmers");
    expect(onCanvases("t-share-menus")).toContain("cv-board-restaurant");
    expect(onCanvases("x-chefs-table")).toContain("cv-xp-chefs");
  });

  it("links every element on a canvas to an element in a chapter", () => {
    for (const [id, views] of ix.canvasesOf) {
      expect(ix.byId.get(id), `${id} on ${views.map((v) => v.id).join(", ")}`).toBeDefined();
    }
  });

  it("finds incoming references", () => {
    const incoming = (ix.incoming.get("ch-app") ?? []).map((r) => r.from);
    expect(incoming).toContain("t-share-menus");
  });
});
