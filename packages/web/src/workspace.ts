import { DocumentRoutes, WorkspaceLinks } from "@cli42/lib/web";
import {
  CANVASES,
  PHASES,
  ROLES,
  STEPS,
  blockMeta,
  drawCanvas,
  type BlockType,
  type CanvasModel,
  type CanvasView,
  type Diagnostic,
  type PayloadDocument,
  type PayloadElement,
  type WorkspacePayload,
} from "@pdt42/core";

// Everything the views look up, computed once per payload.

export interface DrawnCanvas {
  view: CanvasView;
  model: CanvasModel | undefined;
}

export class WorkspaceIndex {
  readonly payload: WorkspacePayload;
  /** The routes of the chapters, and the links to elements (@cli42/lib/web). */
  readonly routes: DocumentRoutes;
  readonly links: WorkspaceLinks;
  readonly byId: Map<string, PayloadElement>;
  readonly canvases: Map<string, DrawnCanvas>;
  /** For every element, the canvases it appears on. */
  readonly canvasesOf: Map<string, CanvasView[]>;
  readonly incoming: Map<string, { from: string; field: string }[]>;

  constructor(payload: WorkspacePayload) {
    this.payload = payload;
    this.routes = new DocumentRoutes(payload.documents.map((d) => d.filePath));
    this.links = new WorkspaceLinks(this.routes, payload.elements);
    this.byId = new Map(payload.elements.map((e) => [e.id, e]));
    this.canvases = new Map();
    this.canvasesOf = new Map();
    for (const view of payload.canvases) {
      const model = drawCanvas(payload, view);
      this.canvases.set(view.id, { view, model });
      for (const id of refIds(model)) {
        const list = this.canvasesOf.get(id) ?? [];
        if (!list.some((v) => v.id === view.id)) list.push(view);
        this.canvasesOf.set(id, list);
      }
    }
    this.incoming = new Map();
    for (const r of payload.references) {
      const list = this.incoming.get(r.to) ?? [];
      list.push({ from: r.from, field: r.field });
      this.incoming.set(r.to, list);
    }
  }

  document(file: string): PayloadDocument | undefined {
    return this.payload.documents.find((d) => d.filePath === file);
  }

  /** The link to an element, opened in its chapter. */
  elementHref(id: string): string | undefined {
    return this.links.elementHref(id);
  }

  /** The link to a placed canvas, in its chapter. */
  canvasHref(view: Pick<CanvasView, "id" | "loc">): string {
    return this.routes.documentHref(view.loc.file, view.id);
  }

  /** The link to a chapter, scrolled to an anchor if given. */
  documentHref(file: string, anchor?: string): string {
    return this.routes.documentHref(file, anchor);
  }

  findings(filter: (d: Diagnostic) => boolean): Diagnostic[] {
    return this.payload.diagnostics.filter(filter);
  }

  /** The chapter a step lives in: its conventional file, or the first file holding its blocks. */
  stepDocument(stepId: string): PayloadDocument | undefined {
    const step = STEPS.find((s) => s.id === stepId);
    return (
      (step && this.document(step.file)) ??
      this.payload.documents.find((d) => d.steps.includes(stepId))
    );
  }
}

/** All element ids an item of a canvas model refers to. */
function refIds(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const v of value) refIds(v, out);
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.kind === "string" && typeof o.title === "string") {
      out.add(o.id);
    }
    for (const v of Object.values(o)) refIds(v, out);
  }
  return out;
}

// ─── Colours ─────────────────────────────────────────────────────────────────

export const ROLE_COLORS: Record<string, string> = {
  owner: "var(--c-owner)",
  stakeholder: "var(--c-stakeholder)",
  "peer-consumer": "var(--c-consumer)",
  "peer-producer": "var(--c-producer)",
  partner: "var(--c-partner)",
};

export const PHASE_COLORS: Record<string, string> = {
  exploration: "var(--c-exploration)",
  design: "var(--c-design)",
  growth: "var(--c-growth)",
};

/** Services are yellow and transactions blue, as on the PDT canvases. */
const KIND_COLORS: Partial<Record<string, string>> = {
  service: "var(--c-service)",
  transaction: "var(--c-transaction)",
  channel: "var(--c-channel)",
};

export function phaseOf(kind: string): string | undefined {
  try {
    const step = STEPS.find((s) => s.id === blockMeta(kind as BlockType).step);
    return step?.phase;
  } catch {
    return undefined;
  }
}

export function colorOf(kind: string, role?: string): string {
  if (role && ROLE_COLORS[role]) return ROLE_COLORS[role]!;
  return KIND_COLORS[kind] ?? PHASE_COLORS[phaseOf(kind) ?? ""] ?? "var(--text-muted)";
}

export function roleLabel(role: string | undefined): string | undefined {
  const r = ROLES.find((x) => x.id === role);
  return r && `${r.code} · ${r.label}`;
}

export function canvasTitle(id: string): string {
  return CANVASES.find((c) => c.id === id)?.title ?? id;
}

export function phaseTitle(id: string): string {
  return PHASES.find((p) => p.id === id)?.title ?? id;
}
