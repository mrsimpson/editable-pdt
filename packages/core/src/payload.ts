import type { IgnoreDirective } from "@cli42/lib/validator";
import type { AstNode } from "./ast.ts";
import type { CanvasView } from "./canvases.ts";
import { STEPS } from "./methodology.ts";
import { titleOf, type Element, type Workspace } from "./model.ts";
import type { StepState, StepStatus } from "./progress.ts";
import type { Diagnostic } from "./validator.ts";

// The workspace as the web renderer consumes it: plain JSON, served by `pdt42 serve` at
// /api/workspace and injected by `pdt42 build` as window.__WORKSPACE__. Its documents,
// elements, diagrams and edges are what every *42 language's payload has — what the semantic
// diff (@cli42/lib/diff) and the shared web views (@cli42/lib/web-react) read.

export interface PayloadDocument {
  /** The document's path relative to the workspace. */
  filePath: string;
  /** The first level-1 heading, or the file name. */
  title: string;
  /** The steps whose chapter this file is (by convention or by the elements it holds). */
  steps: string[];
  nodes: AstNode[];
}

/** An element: its attributes (flat), kind and location, title and prose. */
export type PayloadElement = Element;

export interface PayloadStep {
  id: string;
  state: StepState;
  count: number;
  findings: number;
}

export interface WorkspacePayload {
  /** The platform's (or ecosystem's) title, if modelled. */
  name: string;
  documents: PayloadDocument[];
  elements: PayloadElement[];
  /** The edges of the model: one per reference (relation = the referencing field). */
  edges: Array<{ from: string; relation: string; to: string }>;
  /** pdt42 has no diagrams; present because every *42 payload has them. */
  diagrams: never[];
  references: { from: string; field: string; to: string }[];
  canvases: CanvasView[];
  diagnostics: Diagnostic[];
  steps: PayloadStep[];
  ignoreDirectives: IgnoreDirective[];
}

export function toPayload(
  ws: Workspace,
  diagnostics: Diagnostic[],
  steps: StepStatus[],
  fallbackName = "Platform design",
): WorkspacePayload {
  const named = ["platform", "ecosystem"].map((kind) => ws.elements.find((e) => e.kind === kind));
  const first = named.find((e) => e !== undefined);
  const name = first ? titleOf(first) : fallbackName;

  const phaseOrder = (file: string) => {
    const step = STEPS.find((s) => s.file === file);
    return step ? STEPS.indexOf(step) : STEPS.length;
  };

  const documents = ws.documents
    .map((doc): PayloadDocument => {
      const h1 = doc.nodes.find((n) => n.kind === "heading" && n.level === 1);
      const byElements = new Set(
        STEPS.filter((s) =>
          ws.elements.some(
            (e) => e.loc.file === doc.filePath && (s.blocks as string[]).includes(e.kind),
          ),
        ).map((s) => s.id),
      );
      const byConvention = STEPS.filter((s) => s.file === doc.filePath).map((s) => s.id);
      const own = STEPS.map((s) => s.id).filter(
        (id) => byConvention.includes(id) || byElements.has(id),
      );
      return {
        filePath: doc.filePath,
        title: h1?.kind === "heading" ? h1.text : (doc.filePath.split("/").pop() ?? doc.filePath),
        steps: own,
        nodes: doc.nodes,
      };
    })
    .sort(
      (a, b) =>
        phaseOrder(a.filePath) - phaseOrder(b.filePath) || a.filePath.localeCompare(b.filePath),
    );

  return {
    name,
    documents,
    elements: ws.elements,
    edges: ws.edges,
    diagrams: [],
    references: ws.references.map((r) => ({ from: r.from.id, field: r.field, to: r.to })),
    canvases: ws.canvases,
    diagnostics,
    steps: steps.map((s) => ({
      id: s.step.id,
      state: s.state,
      count: s.count,
      findings: s.findings.length,
    })),
    ignoreDirectives: ws.ignoreDirectives,
  };
}
