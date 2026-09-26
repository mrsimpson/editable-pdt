import { describe, expect, test } from "vite-plus/test";
import { parseMarkdown } from "../src/parser.ts";
import type { BlockNode } from "../src/ast.ts";

describe("parseMarkdown", () => {
  test("reads blocks, scalar attributes and `- item` lists", () => {
    const ast = parseMarkdown(
      "x.pdt.md",
      "# T\n\n```pdt\n:::entity\nid: e-a\npressures:\n  - One, with comma\n  - Two\n:::\n```\n",
    );
    const block = ast.nodes.find((n): n is BlockNode => n.kind === "block")!;
    expect(block.blockType).toBe("entity");
    expect(block.attributes).toEqual({ id: "e-a", pressures: ["One, with comma", "Two"] });
    expect(block.attributeLines.pressures).toBe(6);
  });

  test("keeps several blocks in one fence and records ignore directives", () => {
    const ast = parseMarkdown(
      "x",
      "```pdt\n:::ignore h104 later :::\n:::entity\nid: a\n:::\n:::entity\nid: b\n:::\n```\n",
    );
    expect(ast.nodes.filter((n) => n.kind === "block")).toHaveLength(2);
    expect(ast.nodes.find((n) => n.kind === "ignore")).toMatchObject({
      code: "H104",
      reason: "later",
    });
  });

  test("skips HTML comments, even when they contain pdt fences", () => {
    const ast = parseMarkdown(
      "x",
      "Before\n\n<!--\n```pdt\n:::entity\nid: hidden\n:::\n```\n-->\n\nAfter\n",
    );
    expect(ast.nodes.some((n) => n.kind === "block")).toBe(false);
    expect(
      ast.nodes.filter((n) => n.kind === "prose").map((n) => (n as { text: string }).text),
    ).toEqual(["Before", "After"]);
  });

  test("leaves other code fences as prose", () => {
    const ast = parseMarkdown("x", "```js\n:::entity\n```\n");
    expect(ast.nodes.map((n) => n.kind)).toEqual(["prose"]);
  });

  test("reports unclosed blocks and unreadable lines", () => {
    const errors = parseMarkdown("x", "```pdt\n:::entity\nid: a\nnot an attribute\n").nodes.filter(
      (n) => n.kind === "parse-error",
    );
    expect(errors.map((e) => e.line)).toEqual([4, 2]);
  });
});
