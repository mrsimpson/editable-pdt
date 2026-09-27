import type { AstNode } from "./ast.ts";
import type { CanvasView } from "./canvases.ts";
import { STEPS } from "./methodology.ts";
import type { Workspace } from "./model.ts";
import type { StepState, StepStatus } from "./progress.ts";
import type { BlockType } from "./schemas.ts";
import type { Diagnostic } from "./validator.ts";

// The workspace as the web renderer consumes it: plain JSON, served by `pdt42 serve` at
// /api/workspace and injected by `pdt42 build` as window.__WORKSPACE__.

export interface PayloadDocument {
  file: string;
  /** The first level-1 heading, or the file name. */
  title: string;
  /** The steps whose chapter this file is (by convention or by the elements it holds). */
  steps: string[];
  nodes: AstNode[];
}

export interface PayloadElement {
  kind: BlockType;
  id: string;
  title: string;
  data: Record<string, unknown>;
  prose: string;
  file: string;
  line: number;
}

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
  references: { from: string; field: string; to: string }[];
  canvases: CanvasView[];
  diagnostics: Diagnostic[];
  steps: PayloadStep[];
}

export function toPayload(
  ws: Workspace,
  diagnostics: Diagnostic[],
  steps: StepStatus[],
  fallbackName = "Platform design",
): WorkspacePayload {
  const name =
    ws.elements.find((e) => e.kind === "platform")?.title ??
    ws.elements.find((e) => e.kind === "ecosystem")?.title ??
    fallbackName;

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
            (e) => e.loc.file === doc.file && (s.blocks as string[]).includes(e.kind),
          ),
        ).map((s) => s.id),
      );
      const byConvention = STEPS.filter((s) => s.file === doc.file).map((s) => s.id);
      const own = STEPS.map((s) => s.id).filter(
        (id) => byConvention.includes(id) || byElements.has(id),
      );
      return {
        file: doc.file,
        title: h1?.kind === "heading" ? h1.text : (doc.file.split("/").pop() ?? doc.file),
        steps: own,
        nodes: doc.nodes,
      };
    })
    .sort((a, b) => phaseOrder(a.file) - phaseOrder(b.file) || a.file.localeCompare(b.file));

  return {
    name,
    documents,
    elements: ws.elements.map((e) => ({
      kind: e.kind,
      id: e.id,
      title: e.title,
      data: e.data as Record<string, unknown>,
      prose: e.prose,
      file: e.loc.file,
      line: e.loc.line,
    })),
    references: ws.references.map((r) => ({ from: r.from.id, field: r.field, to: r.to })),
    canvases: ws.canvases,
    diagnostics,
    steps: steps.map((s) => ({
      id: s.step.id,
      state: s.state,
      count: s.count,
      findings: s.findings.length,
    })),
  };
}
