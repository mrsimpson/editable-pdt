import { z } from "zod";
import type { BlockNode, SourceLocation } from "./ast.ts";
import { CANVASES, canvasById } from "./methodology.ts";
import { PEER_ROLES } from "./schemas.ts";
import type { Element, Workspace } from "./model.ts";

// Canvases are views, not elements. A `:::canvas` block places one of the PDT canvases in a
// chapter; its content is generated from the model, so the canvas can never drift from it.
//
//   :::canvas
//   id: cv-board-kitchen
//   canvas: transactions-board
//   of: r-farmer-restaurant        (only for canvases drawn once per element)
//   :::

export interface CanvasView {
  id: string;
  canvas: string;
  /** The element the canvas is drawn for, for per-element canvases. */
  of?: string;
  loc: SourceLocation;
  /** The heading the canvas sits under, if any. */
  heading?: string;
}

const CANVAS_IDS = CANVASES.map((c) => c.id) as [string, ...string[]];

export const CanvasBlockSchema = z.object({
  id: z.string().min(1, "must not be empty"),
  canvas: z.enum(CANVAS_IDS),
  of: z.string().min(1).optional(),
});

export interface CanvasParseIssue {
  message: string;
  loc: SourceLocation;
}

export function toCanvasView(
  node: BlockNode,
  file: string,
  heading: string | undefined,
): { view?: CanvasView; issues: CanvasParseIssue[] } {
  const attributes = Object.fromEntries(
    Object.entries(node.attributes).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v]),
  );
  const parsed = CanvasBlockSchema.strict().safeParse(attributes);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((issue) => {
        const key = String(issue.path[0] ?? "");
        return {
          message: key ? `:::canvas ${key}: ${issue.message}` : `:::canvas: ${issue.message}`,
          loc: { file, line: node.attributeLines[key] ?? node.startLine },
        };
      }),
    };
  }
  return {
    view: { ...parsed.data, loc: { file, line: node.startLine }, heading },
    issues: [],
  };
}

/**
 * For canvases drawn once per element: the elements that need a canvas of their own.
 * Undefined for canvases drawn once per workspace.
 */
export function canvasScope(ws: Workspace, canvasId: string): Element[] | undefined {
  const canvas = canvasById(canvasId);
  if (!canvas?.per) return undefined;
  const referenced = (kind: string, field: string) => {
    const ids = new Set(
      ws.elements
        .filter((e) => e.kind === kind)
        .map((e) => (e.data as Record<string, unknown>)[field])
        .filter((v): v is string => typeof v === "string"),
    );
    return ws.elements.filter((e) => ids.has(e.id));
  };
  switch (canvasId) {
    case "wardley-map":
      return referenced("component", "arena");
    case "entity-portrait":
      return ws.elements.filter(
        (e) =>
          e.kind === "entity" &&
          (PEER_ROLES as readonly string[]).includes(String((e.data as { role?: string }).role)),
      );
    case "transactions-board":
      return referenced("transaction", "relationship");
    case "network-properties":
      return referenced("network", "relationship");
    case "liquidity":
      return referenced("liquidity", "relationship");
    default:
      return ws.elements.filter((e) => e.kind === canvas.per);
  }
}
