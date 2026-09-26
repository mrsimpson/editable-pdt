import type { DocumentAst, HeadingNode, ProseNode, SourceLocation } from "./ast.ts";
import { parseMarkdown } from "./parser.ts";
import { BLOCK_SCHEMAS, blockFields, isBlockType, type BlockData, type BlockType } from "./schemas.ts";

// Builds the element model from parsed documents. Blocks are validated against their zod schema;
// problems become build issues with precise file:line locations. The validator adds the
// cross-element rules on top.

export interface Element<K extends BlockType = BlockType> {
  kind: K;
  id: string;
  /** `title` if present, else the heading above the block, else the id. */
  title: string;
  data: BlockData<K>;
  /** Markdown between the heading and the block: the explanation of the element. */
  prose: string;
  heading?: { text: string; level: number; line: number };
  loc: SourceLocation;
  endLine: number;
  attributeLines: Record<string, number>;
}

export interface BuildIssue {
  code: "E003" | "E004";
  message: string;
  loc: SourceLocation;
  element?: string;
}

export interface Reference {
  from: Element;
  field: string;
  to: string;
  loc: SourceLocation;
}

export interface Workspace {
  documents: DocumentAst[];
  elements: Element[];
  byId: Map<string, Element>;
  issues: BuildIssue[];
  /** Rule codes suppressed per file. */
  ignores: Map<string, Set<string>>;
  references: Reference[];
}

export function buildWorkspace(documents: DocumentAst[]): Workspace {
  const elements: Element[] = [];
  const issues: BuildIssue[] = [];
  const ignores = new Map<string, Set<string>>();

  for (const doc of documents) {
    const fileIgnores = new Set<string>();
    ignores.set(doc.file, fileIgnores);
    let heading: HeadingNode | undefined;
    let prose: ProseNode[] = [];
    let blocksUnderHeading = 0;

    for (const node of doc.nodes) {
      switch (node.kind) {
        case "heading":
          heading = node;
          prose = [];
          blocksUnderHeading = 0;
          break;
        case "prose":
          prose.push(node);
          break;
        case "ignore":
          fileIgnores.add(node.code);
          break;
        case "parse-error":
          issues.push({ code: "E004", message: node.message, loc: { file: doc.file, line: node.line } });
          break;
        case "block": {
          blocksUnderHeading++;
          const loc = { file: doc.file, line: node.startLine };
          if (!isBlockType(node.blockType)) {
            issues.push({ code: "E004", message: `Unknown block type :::${node.blockType}`, loc });
            break;
          }
          const kind = node.blockType;
          const known = new Set(blockFields(kind).map((f) => f.name));
          for (const key of Object.keys(node.attributes)) {
            if (!known.has(key)) {
              issues.push({
                code: "E003",
                message: `:::${kind} has no attribute "${key}"`,
                loc: { file: doc.file, line: node.attributeLines[key] ?? node.startLine },
                element: String(node.attributes.id ?? ""),
              });
            }
          }
          const parsed = BLOCK_SCHEMAS[kind].safeParse(node.attributes);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              const key = String(issue.path[0] ?? "");
              issues.push({
                code: "E003",
                message: key ? `${key}: ${issue.message}` : issue.message,
                loc: { file: doc.file, line: node.attributeLines[key] ?? node.startLine },
                element: String(node.attributes.id ?? ""),
              });
            }
            break;
          }
          const data = parsed.data as BlockData<typeof kind>;
          const title =
            ("title" in data && typeof data.title === "string" && data.title) ||
            (heading && blocksUnderHeading === 1 ? heading.text : "") ||
            data.id;
          elements.push({
            kind,
            id: data.id,
            title,
            data,
            prose: prose.map((p) => p.text).join("\n\n"),
            heading: heading ? { text: heading.text, level: heading.level, line: heading.line } : undefined,
            loc,
            endLine: node.endLine,
            attributeLines: node.attributeLines,
          });
          prose = [];
          break;
        }
      }
    }
  }

  const byId = new Map<string, Element>();
  for (const element of elements) if (!byId.has(element.id)) byId.set(element.id, element);

  return { documents, elements, byId, issues, ignores, references: collectReferences(elements) };
}

function collectReferences(elements: Element[]): Reference[] {
  const out: Reference[] = [];
  for (const element of elements) {
    for (const field of blockFields(element.kind)) {
      if (field.kind !== "ref" && field.kind !== "refs") continue;
      const value = (element.data as Record<string, unknown>)[field.name];
      for (const to of ([] as unknown[]).concat(value ?? [])) {
        if (typeof to === "string" && to) {
          out.push({ from: element, field: field.name, to, loc: { file: element.loc.file, line: element.attributeLines[field.name] ?? element.loc.line } });
        }
      }
    }
  }
  return out;
}

export function parseWorkspace(files: { file: string; content: string }[]): Workspace {
  return buildWorkspace(files.map((f) => parseMarkdown(f.file, f.content)));
}

export function elementsOf<K extends BlockType>(ws: Workspace, kind: K): Element<K>[] {
  return ws.elements.filter((e): e is Element<K> => e.kind === kind);
}

export function get<K extends BlockType>(ws: Workspace, kind: K, id: string | undefined): Element<K> | undefined {
  const element = id ? ws.byId.get(id) : undefined;
  return element?.kind === kind ? (element as Element<K>) : undefined;
}

/** Elements that reference `id`, with the field they use. */
export function incoming(ws: Workspace, id: string): Reference[] {
  return ws.references.filter((r) => r.to === id);
}
