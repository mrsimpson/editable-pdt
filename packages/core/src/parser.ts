import type { AstNode, BlockNode, DocumentAst, ProseNode } from "./ast.ts";

// Line-oriented parser for `.pdt.md` files.
//
//   # Heading                    headings of any level
//   ```pdt … ```                 a fence holding one or more typed blocks
//   :::type / key: value / :::   a typed block inside a pdt fence
//   key:                         followed by indented `- item` lines: a text list
//   :::ignore CODE reason :::    suppresses a rule for the whole file
//
// Everything else is prose and is kept verbatim.

const PDT_FENCE = /^```\s*pdt\s*$/;
const OTHER_FENCE = /^(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const BLOCK_OPEN = /^:::([a-z][a-z0-9-]*)\s*$/;
const IGNORE = /^:::ignore\s+([A-Za-z]\d{3})\s*(.*?)\s*:::\s*$/;
const ATTRIBUTE = /^([a-z][a-z0-9-]*):\s*(.*)$/;
const LIST_ITEM = /^\s+-\s+(.*)$/;

export function parseMarkdown(file: string, content: string): DocumentAst {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const nodes: AstNode[] = [];
  let prose: { lines: string[]; start: number } | null = null;
  let inPdtFence = false;
  let fenceStart = 0;
  let otherFence: string | null = null;
  let block: BlockNode | null = null;
  let lastKey: string | null = null;

  const flushProse = () => {
    if (!prose) return;
    const first = prose.lines.findIndex((l) => l.trim() !== "");
    if (first >= 0) {
      let last = prose.lines.length - 1;
      while (prose.lines[last]!.trim() === "") last--;
      const node: ProseNode = {
        kind: "prose",
        text: prose.lines.slice(first, last + 1).join("\n"),
        startLine: prose.start + first,
        endLine: prose.start + last,
      };
      nodes.push(node);
    }
    prose = null;
  };

  const addProse = (line: string, lineNo: number) => {
    if (!prose) prose = { lines: [], start: lineNo };
    prose.lines.push(line);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNo = i + 1;
    const trimmed = line.trim();

    if (otherFence) {
      if (trimmed.startsWith(otherFence)) otherFence = null;
      addProse(line, lineNo);
      continue;
    }

    if (inPdtFence) {
      if (block) {
        if (trimmed === ":::") {
          block.endLine = lineNo;
          nodes.push(block);
          block = null;
          continue;
        }
        const item = LIST_ITEM.exec(line);
        if (item && lastKey) {
          const current = block.attributes[lastKey];
          block.attributes[lastKey] = [...(Array.isArray(current) ? current : []), item[1]!.trim()];
          continue;
        }
        const attribute = ATTRIBUTE.exec(line);
        if (attribute) {
          lastKey = attribute[1]!;
          const value = attribute[2]!.trim();
          block.attributes[lastKey] = value === "" ? [] : value;
          block.attributeLines[lastKey] = lineNo;
          continue;
        }
        if (trimmed !== "") {
          nodes.push({ kind: "parse-error", line: lineNo, message: `Cannot read "${trimmed}" inside :::${block.blockType}` });
        }
        continue;
      }
      if (trimmed === "```") {
        inPdtFence = false;
        continue;
      }
      const ignore = IGNORE.exec(trimmed);
      if (ignore) {
        nodes.push({ kind: "ignore", code: ignore[1]!.toUpperCase(), reason: ignore[2]!, line: lineNo });
        continue;
      }
      const open = BLOCK_OPEN.exec(trimmed);
      if (open) {
        block = {
          kind: "block",
          blockType: open[1]!,
          attributes: {},
          attributeLines: {},
          startLine: lineNo,
          endLine: lineNo,
          fenceStart,
        };
        lastKey = null;
        continue;
      }
      if (trimmed !== "") {
        nodes.push({ kind: "parse-error", line: lineNo, message: `Expected :::type, found "${trimmed}"` });
      }
      continue;
    }

    if (PDT_FENCE.test(line)) {
      flushProse();
      inPdtFence = true;
      fenceStart = lineNo;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushProse();
      nodes.push({ kind: "heading", level: heading[1]!.length, text: heading[2]!, line: lineNo });
      continue;
    }

    const fence = OTHER_FENCE.exec(line);
    if (fence) otherFence = fence[1]!;
    addProse(line, lineNo);
  }

  if (block) nodes.push({ kind: "parse-error", line: block.startLine, message: `:::${block.blockType} is never closed` });
  else if (inPdtFence) nodes.push({ kind: "parse-error", line: fenceStart, message: "pdt fence is never closed" });
  flushProse();

  return { file, nodes };
}
