import { describe, expect, test } from "vite-plus/test";
import { parseMarkdown } from "../src/parser.ts";
import { parseWorkspace } from "../src/model.ts";
import type { BlockNode } from "../src/ast.ts";

describe("parseMarkdown", () => {
  test("reads blocks, scalar attributes and `- item` lists", () => {
    const ast = parseMarkdown(
      "x.pdt42.md",
      "# T\n\n```pdt42\n:::entity\nid: e-a\npressures:\n  - One, with comma\n  - Two\n:::\n```\n",
    );
    const block = ast.nodes.find((n): n is BlockNode => n.kind === "block")!;
    expect(block.blockType).toBe("entity");
    expect(block.attributes).toEqual({ id: "e-a", pressures: "" });
    expect(block.lists).toEqual({ pressures: ["One, with comma", "Two"] });
  });

  test("keeps several blocks in one fence and records ignore directives", () => {
    const ast = parseMarkdown(
      "x",
      "```pdt42\n:::ignore H104 later :::\n:::entity\nid: a\n:::\n:::entity\nid: b\n:::\n```\n",
    );
    expect(ast.nodes.filter((n) => n.kind === "block")).toHaveLength(2);
    expect(ast.nodes.find((n) => n.kind === "ignore")).toMatchObject({
      ruleCode: "H104",
      reason: "later",
    });
  });

  test("skips HTML comments, even when they contain pdt42 fences", () => {
    const ast = parseMarkdown(
      "x",
      "Before\n\n<!--\n```pdt42\n:::entity\nid: hidden\n:::\n```\n-->\n\nAfter\n",
    );
    expect(ast.nodes.some((n) => n.kind === "block")).toBe(false);
    expect(
      ast.nodes
        .filter((n) => n.kind === "prose")
        .map((n) => (n as { text: string }).text)
        .filter((text) => text !== ""),
    ).toEqual(["Before", "After"]);
  });

  test("leaves other code fences as prose", () => {
    const ast = parseMarkdown("x", "```js\n:::entity\n```\n");
    expect(new Set(ast.nodes.map((n) => n.kind))).toEqual(new Set(["prose"]));
  });

  test("reports unclosed blocks and unreadable lines as build errors (EG02)", () => {
    const ws = parseWorkspace([
      {
        file: "x",
        content:
          "```pdt42\n:::entity\nid: e-a\ntitle: A\nnot an attribute\n:::\n:::entity\nid: e-b\ntitle: B\n",
      },
    ]);
    expect(ws.parseErrors.map((e) => e.line).sort((a, b) => a - b)).toEqual([5, 7]);
  });
});
