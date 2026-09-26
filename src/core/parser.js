// Line-oriented parser for .pdt.md files.
//
// Recognised syntax:
//   # Heading                   headings of any level
//   ```pdt ... ```              a fence holding one or more typed blocks
//   :::type / key: value / :::  a typed block inside a pdt fence
//   key:                        followed by indented "- item" lines: a list
//   :::ignore CODE reason :::   suppresses a rule for the whole file
//
// Everything else is prose and kept verbatim. The parser does not know the
// block types: it emits whatever it finds and the model builder decides.

const FENCE_OPEN = /^```\s*pdt\s*$/;
const FENCE = /^(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const BLOCK_OPEN = /^:::([a-z][a-z0-9-]*)\s*$/;
const IGNORE = /^:::ignore\s+([A-Za-z]\d{3})\s*(.*?)\s*:::\s*$/;
const ATTRIBUTE = /^([a-z][a-z0-9-]*):\s*(.*)$/;
const LIST_ITEM = /^\s+-\s+(.*)$/;

export function parseDocument(file, content) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const nodes = [];
  let prose = null;
  let inPdtFence = false;
  let fenceStart = 0;
  let otherFence = null;
  let block = null;
  let lastKey = null;

  const flushProse = () => {
    if (prose) {
      const text = prose.lines.join("\n").trim();
      if (text) {
        // Line range of the text itself, without the blank lines around it.
        const first = prose.lines.findIndex((l) => l.trim() !== "");
        const last = prose.lines.length - 1 - [...prose.lines].reverse().findIndex((l) => l.trim() !== "");
        nodes.push({ kind: "prose", text, startLine: prose.start + first, endLine: prose.start + last });
      }
      prose = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (otherFence) {
      if (line.startsWith(otherFence)) otherFence = null;
      addProse(line, lineNo);
      continue;
    }

    if (inPdtFence) {
      if (block) {
        if (line.trim() === ":::") {
          block.endLine = lineNo;
          nodes.push(block);
          block = null;
          continue;
        }
        const item = LIST_ITEM.exec(line);
        if (item && lastKey) {
          const current = block.attributes[lastKey];
          block.attributes[lastKey] = Array.isArray(current)
            ? [...current, item[1].trim()]
            : [item[1].trim()];
          continue;
        }
        const attribute = ATTRIBUTE.exec(line);
        if (attribute) {
          lastKey = attribute[1];
          const value = attribute[2].trim();
          block.attributes[lastKey] = value === "" ? [] : value;
          continue;
        }
        if (line.trim() !== "") {
          nodes.push({ kind: "error", line: lineNo, message: `Cannot read "${line.trim()}" inside :::${block.type}` });
        }
        continue;
      }
      if (line.trim() === "```") {
        inPdtFence = false;
        continue;
      }
      const ignore = IGNORE.exec(line.trim());
      if (ignore) {
        nodes.push({ kind: "ignore", code: ignore[1].toUpperCase(), reason: ignore[2], line: lineNo });
        continue;
      }
      const open = BLOCK_OPEN.exec(line.trim());
      if (open) {
        block = { kind: "block", type: open[1], attributes: {}, startLine: lineNo, endLine: lineNo, fenceStart };
        lastKey = null;
        continue;
      }
      if (line.trim() !== "") {
        nodes.push({ kind: "error", line: lineNo, message: `Expected :::type, found "${line.trim()}"` });
      }
      continue;
    }

    if (FENCE_OPEN.test(line)) {
      flushProse();
      inPdtFence = true;
      fenceStart = lineNo;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushProse();
      nodes.push({ kind: "heading", level: heading[1].length, text: heading[2], line: lineNo });
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) otherFence = fence[1];
    addProse(line, lineNo);
  }

  if (block) nodes.push({ kind: "error", line: block.startLine, message: `:::${block.type} is never closed` });
  else if (inPdtFence) nodes.push({ kind: "error", line: fenceStart, message: "pdt fence is never closed" });
  flushProse();

  // Record where each fence ends so writers can replace whole fences.
  for (const node of nodes) {
    if (node.kind !== "block") continue;
    for (let i = node.endLine; i < lines.length; i++) {
      if (lines[i].trim() === "```") {
        node.fenceEnd = i + 1;
        break;
      }
    }
  }

  return { file, content, lines, nodes };

  function addProse(line, lineNo) {
    if (!prose) prose = { lines: [], start: lineNo, end: lineNo };
    prose.lines.push(line);
    prose.end = lineNo;
  }
}
