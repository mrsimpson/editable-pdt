import { buildIndex, buildWorkspace as buildModel } from "@cli42/lib/model";
import type { ElementOf, ParseError, ParseWarning } from "@cli42/lib/model";
import type { IgnoreDirective } from "@cli42/lib/validator";
import type { BlockNode, DocumentAst, SourceLocation } from "./ast.ts";
import { parseMarkdown } from "./parser.ts";
import { toCanvasView, type CanvasView } from "./canvases.ts";
import { BLOCK_SCHEMAS, blockFields, type BlockType } from "./schemas.ts";

// Builds the element model from parsed documents with the model builder every *42 language
// shares (@cli42/lib/model): blocks are validated against their schema into flat elements
// (`{ ...attributes, kind, loc }`), and what cannot be built becomes a parse error (or, for
// unknown attributes, a warning). Canvases are views, not elements: pdt42 reads them apart.

type Schemas = typeof BLOCK_SCHEMAS;

/** An element of kind K, as in every *42 language: its attributes (flat), kind and location. */
export type Element<K extends BlockType = BlockType> = K extends BlockType
  ? ElementOf<Pick<Schemas, K>, SourceLocation>
  : never;

/** What an element is called: its `title`, else the heading above its block, else its id. */
export function titleOf(element: Element): string {
  const title = (element as { title?: unknown }).title;
  return (typeof title === "string" && title) || element.loc.heading || element.id;
}

/** The prose between the heading and the element's block: the explanation of the element. */
export function proseOf(element: Element): string {
  return element.loc.prose?.trim() ?? "";
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
  /** Blocks that could not be built. */
  parseErrors: ParseError[];
  /** `:::canvas` blocks that could not be read (E006). */
  canvasIssues: Array<{ message: string; file: string; line: number }>;
  /** Blocks built with attributes their schema does not know. */
  parseWarnings: ParseWarning[];
  ignoreDirectives: IgnoreDirective[];
  references: Reference[];
  /** The edges of the model, as the semantic diff reads them (relation = reference field). */
  edges: Array<{ from: string; relation: string; to: string }>;
  /** The canvases placed in the chapters, in document order. */
  canvases: CanvasView[];
  diagrams: never[];
}

/** The value of a block's attribute on its element (the `kind:` attribute is `category`). */
export function fieldValue(element: Element, field: string): unknown {
  return (element as unknown as Record<string, unknown>)[field === "kind" ? "category" : field];
}

/** Canvases are read apart from the model builder: they are views, not elements. */
function withoutCanvases(doc: DocumentAst): DocumentAst {
  return {
    ...doc,
    nodes: doc.nodes.filter((node) => !(node.kind === "block" && node.blockType === "canvas")),
  };
}

export function buildWorkspace(documents: DocumentAst[]): Workspace {
  const built = buildModel(documents.map(withoutCanvases), { elements: BLOCK_SCHEMAS });
  const canvasIssues: Workspace["canvasIssues"] = [];

  const canvases: CanvasView[] = [];
  for (const doc of documents) {
    let heading: string | undefined;
    for (const node of doc.nodes) {
      if (node.kind === "heading") heading = node.text;
      if (node.kind !== "block") continue;
      if (node.blockType !== "canvas") continue;
      const { view, issues } = toCanvasView(node as BlockNode, doc.filePath, heading);
      if (view) canvases.push(view);
      for (const issue of issues) canvasIssues.push({ message: issue.message, ...issue.loc });
    }
  }

  const elements = built.elements as Element[];

  const byId = new Map<string, Element>();
  for (const element of elements) if (!byId.has(element.id)) byId.set(element.id, element);

  return {
    documents,
    elements,
    byId,
    parseErrors: built.parseErrors,
    canvasIssues,
    parseWarnings: built.parseWarnings,
    ignoreDirectives: built.ignoreDirectives,
    references: collectReferences(elements),
    edges: buildIndex(elements, BLOCK_SCHEMAS).edges,
    canvases,
    diagrams: [],
  };
}

function collectReferences(elements: Element[]): Reference[] {
  const out: Reference[] = [];
  for (const element of elements) {
    for (const field of blockFields(element.kind)) {
      if (field.kind !== "ref" && field.kind !== "refs") continue;
      for (const to of ([] as unknown[]).concat(fieldValue(element, field.name) ?? [])) {
        if (typeof to === "string" && to) {
          out.push({ from: element, field: field.name, to, loc: element.loc });
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

export function get<K extends BlockType>(
  ws: Workspace,
  kind: K,
  id: string | undefined,
): Element<K> | undefined {
  const element = id ? ws.byId.get(id) : undefined;
  return element?.kind === kind ? (element as Element<K>) : undefined;
}

/** Elements that reference `id`, with the field they use. */
export function incoming(ws: Workspace, id: string): Reference[] {
  return ws.references.filter((r) => r.to === id);
}
