import { BLOCK_TYPES, CHAPTERS } from "./schema.js";
import { parseDocument } from "./parser.js";

// Turns parsed documents into the element model every command works on.

export function buildWorkspace(documents) {
  const elements = [];
  const parseErrors = [];
  const ignores = new Map();

  for (const doc of documents) {
    let heading = null;
    let proseSinceHeading = [];
    let blocksUnderHeading = 0;
    const fileIgnores = new Set();
    ignores.set(doc.file, fileIgnores);

    for (const node of doc.nodes) {
      if (node.kind === "heading") {
        heading = node;
        proseSinceHeading = [];
        blocksUnderHeading = 0;
      } else if (node.kind === "prose") {
        proseSinceHeading.push(node);
      } else if (node.kind === "ignore") {
        fileIgnores.add(node.code);
      } else if (node.kind === "error") {
        parseErrors.push({ file: doc.file, line: node.line, message: node.message });
      } else if (node.kind === "block") {
        blocksUnderHeading++;
        elements.push(toElement(doc, node, heading, proseSinceHeading, blocksUnderHeading));
        proseSinceHeading = [];
      }
    }
  }

  const byId = new Map();
  for (const element of elements) if (!byId.has(element.id)) byId.set(element.id, element);

  return { documents, elements, byId, parseErrors, ignores };
}

function toElement(doc, block, heading, prose, position) {
  const schema = BLOCK_TYPES[block.type];
  const raw = block.attributes;
  const attributes = {};
  for (const [key, value] of Object.entries(raw)) {
    attributes[key] = normalize(schema?.attributes[key]?.kind, value);
  }
  const title = attributes.title || (heading && position === 1 ? heading.text : "") || attributes.id || "";
  return {
    id: typeof attributes.id === "string" ? attributes.id : "",
    type: block.type,
    known: Boolean(schema),
    title,
    attributes,
    raw,
    prose: prose.map((p) => p.text).join("\n\n"),
    heading: heading ? { text: heading.text, level: heading.level, line: heading.line } : null,
    positionUnderHeading: position,
    file: doc.file,
    line: block.startLine,
    endLine: block.endLine,
    fenceStart: block.fenceStart,
    fenceEnd: block.fenceEnd,
    proseStart: prose[0]?.startLine,
    proseEnd: prose.at(-1)?.endLine,
  };
}

export function normalize(kind, value) {
  if (kind === "refs") {
    const items = Array.isArray(value) ? value : String(value).split(",");
    return items.map((s) => s.trim()).filter(Boolean);
  }
  if (kind === "list") {
    if (Array.isArray(value)) return value;
    return value.trim() === "" ? [] : [value.trim()];
  }
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

export function parseWorkspace(files) {
  return buildWorkspace(files.map((f) => parseDocument(f.file, f.content)));
}

export function elementsOfType(workspace, type) {
  return workspace.elements.filter((e) => e.type === type);
}

// Which file a new block of `type` belongs in: next to its siblings if any
// exist, otherwise in the chapter file for its type.
export function targetFileFor(workspace, type) {
  const sibling = workspace.elements.find((e) => e.type === type);
  if (sibling) return sibling.file;
  const chapter = CHAPTERS.find((c) => c.number === BLOCK_TYPES[type].chapter);
  const prefix = String(chapter.number).padStart(2, "0");
  const existing = workspace.documents.find((d) => basename(d.file).startsWith(prefix));
  return existing ? existing.file : `${prefix}-${chapter.slug}.pdt.md`;
}

function basename(path) {
  return path.split(/[\\/]/).pop();
}

// A serialisable view of the workspace for the browser.
export function toJSON(workspace) {
  return {
    elements: workspace.elements.map(({ raw, ...rest }) => rest),
    files: workspace.documents.map((d) => d.file),
  };
}
