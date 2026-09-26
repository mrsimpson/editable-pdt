import { BLOCK_TYPES } from "./schema.js";
import { parseDocument } from "./parser.js";

// Writes edits back into the Markdown source. Every edit touches only the
// lines of the element it changes, so prose, comments and layout around it
// survive.

export function serializeBlock(type, attributes) {
  const schema = BLOCK_TYPES[type];
  const keys = [...Object.keys(schema?.attributes ?? {}), ...Object.keys(attributes)];
  const lines = [`:::${type}`];
  for (const key of new Set(keys)) {
    const value = attributes[key];
    if (value === undefined || value === null || value === "") continue;
    const kind = schema?.attributes[key]?.kind;
    if (Array.isArray(value)) {
      const items = value.map((v) => String(v).trim()).filter(Boolean);
      if (items.length === 0) continue;
      if (kind === "refs") lines.push(`${key}: ${items.join(", ")}`);
      else lines.push(`${key}:`, ...items.map((item) => `  - ${item}`));
    } else {
      lines.push(`${key}: ${String(value).replace(/\s*\n\s*/g, " ").trim()}`);
    }
  }
  lines.push(":::");
  return lines;
}

export function updateElement(content, element, { attributes, prose }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const title = attributes.title ?? element.title;

  lines.splice(element.line - 1, element.endLine - element.line + 1, ...serializeBlock(element.type, attributes));

  if (prose !== undefined) {
    const proseLines = prose.trim() ? prose.trim().split("\n") : [];
    if (element.proseStart) {
      const replacement = proseLines.length ? proseLines : [];
      const start = element.proseStart - 1;
      let count = element.proseEnd - element.proseStart + 1;
      if (!replacement.length && lines[start + count] === "") count++;
      lines.splice(start, count, ...replacement);
    } else if (proseLines.length) {
      lines.splice(element.fenceStart - 1, 0, ...proseLines, "");
    }
  }

  if (element.heading && element.positionUnderHeading === 1 && title && element.heading.text === element.title && title !== element.title) {
    lines[element.heading.line - 1] = `${"#".repeat(element.heading.level)} ${title}`;
  }
  return lines.join("\n");
}

export function appendElement(content, type, attributes, prose = "", level = 2) {
  const title = attributes.title || attributes.id;
  const section = [`${"#".repeat(level)} ${title}`, ""];
  if (prose.trim()) section.push(...prose.trim().split("\n"), "");
  section.push("```pdt", ...serializeBlock(type, attributes), "```", "");
  const base = content.replace(/\s*$/, "");
  return (base ? `${base}\n\n` : "") + section.join("\n");
}

export function removeElement(content, element) {
  const doc = parseDocument(element.file, content);
  const lines = doc.lines.slice();
  const blocksInFence = doc.nodes.filter((n) => n.kind === "block" && n.fenceStart === element.fenceStart);
  const headings = doc.nodes.filter((n) => n.kind === "heading");
  const nextHeading = headings.find((h) => h.line > element.line);
  const sectionBlocks = element.heading
    ? doc.nodes.filter((n) => n.kind === "block" && n.startLine > element.heading.line && (!nextHeading || n.startLine < nextHeading.line))
    : [];

  if (element.heading && sectionBlocks.length === 1) {
    const end = nextHeading ? nextHeading.line - 1 : lines.length;
    lines.splice(element.heading.line - 1, end - element.heading.line + 1);
  } else if (blocksInFence.length === 1 && element.fenceEnd) {
    lines.splice(element.fenceStart - 1, element.fenceEnd - element.fenceStart + 1);
  } else {
    lines.splice(element.line - 1, element.endLine - element.line + 1);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
}

// A readable, unique id for a new element: prefix plus slugged title.
export function suggestId(type, title, taken) {
  const prefix = { platform: "platform", entity: "e", motivation: "m", channel: "ch", transaction: "t", service: "s", "learning-engine": "le", experience: "x", mvp: "mvp" }[type] ?? type;
  const slug = String(title || type).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "new";
  let id = `${prefix}-${slug}`;
  for (let n = 2; taken.has(id); n++) id = `${prefix}-${slug}-${n}`;
  return id;
}
