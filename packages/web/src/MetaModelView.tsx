/**
 * MetaModelView — pdt42 meta-model diagram.
 *
 * Rendering primitives come from @cli42/lib/web-react (MetaModelDiagram, autoFaces).
 * This file owns only pdt42-specific data:
 *   - NODE_POS       → pixel positions per block type
 *   - NODE_LABEL     → human-readable labels per kind
 *   - HIDDEN_KINDS   → kinds to omit entirely (moat: limited edges, clutters layout)
 *   - SKIP_EDGES     → specific edges to suppress (mostly the redundant entity fan-ins
 *                       that make every design-phase node point to entity; the entity
 *                       hub is shown via the structural edges only)
 *   - EDGE_OVERRIDES → face/curve corrections for remaining visually problematic edges
 *
 * Design decisions for readability:
 *   Entity is the hub of the model but drawing all 19 incoming edges destroys legibility.
 *   We keep only the "defining" entity edges (job:entities, brief:entities,
 *   platform:owners, platform:core-entity) and suppress the rest — readers can infer
 *   that all actor-like nodes deal with entity-roles.
 *
 *   Similarly, "relationship" is pointed to by 6 growth nodes all going right→left.
 *   We keep only the most structurally important ones (transaction, network).
 *
 *   Moat is hidden entirely — it only points to entity/arena, both already shown.
 */

import { MetaModelDiagram, autoFaces } from "@cli42/lib/web-react";
import type { DiagramNode, DiagramEdge, Face } from "@cli42/lib/web-react";
import { BLOCK_TYPES, blockMeta, crossReferences } from "@pdt42/core";
import type { BlockType } from "@pdt42/core";

// ── SVG layout constants ──────────────────────────────────────────────────────

const SVG_W = 1220;
const SVG_H = 680;

// Node box dimensions (must match NODE_W/NODE_H from @cli42/lib/web-react = 128×28)
// Reproduced here for layout calculation comments only.

// ── Node labels and colors ────────────────────────────────────────────────────

const NODE_LABEL: Record<BlockType, string> = {
  ecosystem: "Ecosystem",
  arena: "Arena",
  job: "Job",
  entity: "Entity",
  asset: "Asset",
  moat: "Moat",
  component: "Component",
  play: "Play",
  scenario: "Scenario",
  brief: "Brief",
  platform: "Platform",
  motivation: "Motivation",
  relationship: "Relationship",
  channel: "Channel",
  transaction: "Transaction",
  "learning-engine": "Learning Engine",
  service: "Service",
  experience: "Experience",
  mvp: "MVP",
  assumption: "Assumption",
  "value-proposition": "Value Prop.",
  network: "Network",
  flywheel: "Flywheel",
  liquidity: "Liquidity",
  "growth-loop": "Growth Loop",
};

/**
 * Color by methodology phase derived from blockMeta(kind).step.
 */
function nodeColor(kind: BlockType): string {
  const step = blockMeta(kind).step;
  if (step.startsWith("E")) return "var(--c-exploration)";
  if (step.startsWith("G")) return "var(--c-growth)";
  return "var(--c-design)";
}

// ── Node positions ────────────────────────────────────────────────────────────
//
// Layout philosophy: four columns with generous vertical spacing.
//
//   Col E  x=80   Exploration entry types: ecosystem, arena, job, entity, asset
//   Col E2 x=280  Exploration synthesis:   component, play, scenario, brief
//   Col D  x=510  Design core:             platform, motivation, relationship,
//                                          channel, transaction
//   Col D2 x=740  Design detail:           learning-engine, service, experience,
//                                          mvp, assumption
//   Col G  x=970  Growth:                  value-proposition, network, flywheel,
//                                          liquidity, growth-loop
//
// Entity sits in col E but at y=320 — central enough to receive edges from
// col D without long arcs, while staying visually in the exploration band.

const NODE_POS: Record<BlockType, [number, number]> = {
  // ── Col E: Exploration entry ──────────────────────────────────────────────
  ecosystem: [80, 55],
  arena: [80, 160],
  job: [80, 270],
  entity: [80, 380],
  asset: [80, 490],
  moat: [80, 590], // hidden

  // ── Col E2: Exploration synthesis ─────────────────────────────────────────
  component: [280, 160],
  play: [280, 270],
  scenario: [280, 380],
  brief: [280, 490],

  // ── Col D: Design core ────────────────────────────────────────────────────
  platform: [510, 55],
  motivation: [510, 160],
  relationship: [510, 290],
  channel: [510, 410],
  transaction: [510, 520],

  // ── Col D2: Design detail ─────────────────────────────────────────────────
  "learning-engine": [740, 160],
  service: [740, 290],
  experience: [740, 410],
  mvp: [740, 520],
  assumption: [740, 600],

  // ── Col G: Growth ─────────────────────────────────────────────────────────
  "value-proposition": [980, 90],
  network: [980, 220],
  flywheel: [980, 360],
  liquidity: [980, 490],
  "growth-loop": [1140, 360],
};

// ── Hidden kinds ──────────────────────────────────────────────────────────────
//
// moat only points to entity and arena (both already shown via other edges).
// Drawing it adds one node and two arrows that cross multiple columns.

const HIDDEN_KINDS = new Set<BlockType>(["moat"]);

// ── Skipped edges ─────────────────────────────────────────────────────────────
//
// The pdt42 model has ~46 edges. Drawing all of them produces an unreadable
// hairball. We skip edges where:
//   1. The target (entity or relationship) already has enough structural context
//      from the kept edges, and the extra edges only add visual noise.
//   2. The edge crosses many columns and would require a large arc that
//      obscures other edges.
//
// Kept entity edges:  job:entities, brief:entities, platform:owners,
//                     platform:core-entity (these establish entity's role)
// Skipped entity edges: all design-phase nodes that use entity as actor
//
// Kept relationship edges: transaction:relationship, network:relationship
//                          (structural; the rest are decorative in this view)
//
// Key: "from:field:to"

const SKIP_EDGES = new Set<string>([
  // Entity fan-in — keep only the defining structural edges
  "component:entity:entity",
  "motivation:from:entity",
  "motivation:to:entity",
  "relationship:between:entity",
  "transaction:from:entity",
  "transaction:to:entity",
  "learning-engine:entity:entity",
  "learning-engine:evolves-to:entity",
  "service:for:entity",
  "experience:core-entity:entity",
  "experience:roles:entity",
  "value-proposition:customer:entity",
  "growth-loop:acquires:entity",
  "asset:relates-to:entity",

  // Relationship fan-in — skip only truly redundant ones
  "experience:relationship:relationship",

  // Arena fan-in — keep job:arena; skip the less-structural ones
  "component:arena:arena",
  "play:arena:arena",
  "scenario:arena:arena",
  "brief:arena:arena",

  // Channel: skip service:channel (transaction:channel is kept)
  "service:channel:channel",

  // Asset:relates-to:job — adds a back-arrow from E col to E col, not useful
  "asset:relates-to:job",
]);

// ── Edge overrides ────────────────────────────────────────────────────────────

interface EdgeOverride {
  fromFace?: Face;
  toFace?: Face;
  cp?: [number, number];
  cubic?: true;
}

const EDGE_OVERRIDES: Record<string, EdgeOverride> = {
  // arena self-references
  "arena:after:arena": { fromFace: "top", toFace: "right", cp: [-28, -28] },
  "arena:enables:arena": { fromFace: "bottom", toFace: "right", cp: [-28, 28] },
  // component self-reference
  "component:needs:component": { fromFace: "top", toFace: "right", cp: [-28, -25] },
  // experience has two step targets (transaction + service) — nudge to separate
  "experience:steps:transaction": { cp: [0, -20] },
  "experience:steps:service": { cp: [0, 20] },
  // platform → entity: two arcs, widely separated — owners enters via top arc, core-entity via bottom arc
  "platform:owners:entity": { fromFace: "left", toFace: "top", cp: [-80, -100] },
  "platform:core-entity:entity": { fromFace: "left", toFace: "bottom", cp: [-40, 80] },
  // job:arena — short upward arc in same column
  "job:arena:arena": { fromFace: "top", toFace: "bottom", cp: [-20, 0] },
  // job:entities — entity is below job in same column, straight down
  "job:entities:entity": { fromFace: "bottom", toFace: "top" },
  // brief [280,490] → entity [80,380]: Brief is right of Entity — exit left, enter right
  "brief:entities:entity": { fromFace: "left", toFace: "right" },
  // network → relationship: goes left, same row
  "network:relationship:relationship": { fromFace: "left", toFace: "right" },
  // transaction [510,520] → relationship [510,290]: same column, straight up
  // nudge slightly right so the label clears the Channel box [510,460]
  "transaction:relationship:relationship": { fromFace: "top", toFace: "bottom", cp: [30, 0] },
  // value-proposition → relationship: long left arc from top of growth col
  "value-proposition:relationship:relationship": {
    fromFace: "left",
    toFace: "right",
    cp: [0, -30],
  },
  // flywheel + liquidity → relationship: spread arcs
  "flywheel:relationship:relationship": { fromFace: "left", toFace: "right", cp: [0, 20] },
  "liquidity:relationship:relationship": { fromFace: "left", toFace: "right", cp: [0, 60] },
  // growth-loop → flywheel: same row, straight left
  "growth-loop:feeds:flywheel": { fromFace: "left", toFace: "right" },
  // flywheel self-reference: exit bottom, enter right
  "flywheel:reinforces:flywheel": { fromFace: "bottom", toFace: "right", cp: [28, 25] },
  // platform → brief: goes via bottom-left
  "platform:brief:brief": { fromFace: "bottom", toFace: "top", cp: [-80, 0] },
};

// ── Build nodes and edges ─────────────────────────────────────────────────────

function buildNodes(): DiagramNode[] {
  return BLOCK_TYPES.filter((kind) => !HIDDEN_KINDS.has(kind)).map((kind) => ({
    id: kind,
    label: NODE_LABEL[kind],
    x: NODE_POS[kind][0],
    y: NODE_POS[kind][1],
    color: nodeColor(kind),
  }));
}

function buildEdges(): DiagramEdge[] {
  const edges: DiagramEdge[] = [];

  for (const { from, field, to } of crossReferences()) {
    if (HIDDEN_KINDS.has(from)) continue;

    for (const targetKind of to as BlockType[]) {
      if (HIDDEN_KINDS.has(targetKind)) continue;
      if (SKIP_EDGES.has(`${from}:${field}:${targetKind}`)) continue;

      const fromPos = NODE_POS[from];
      const toPos = NODE_POS[targetKind];
      if (!fromPos || !toPos) continue;

      const override = EDGE_OVERRIDES[`${from}:${field}:${targetKind}`];
      const [autoFrom, autoTo] = autoFaces(fromPos, toPos);

      edges.push({
        from,
        to: targetKind,
        label: field,
        fromFace: override?.fromFace ?? autoFrom,
        toFace: override?.toFace ?? autoTo,
        cp: override?.cp,
        cubic: override?.cubic,
      });
    }
  }

  return edges;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headingStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  marginBottom: "0.25rem",
  color: "var(--text)",
};

const subStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--text-muted)",
  marginBottom: "1.5rem",
};

const wrapStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--bg-card)",
  padding: "1rem",
  overflowX: "auto",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface MetaModelViewProps {
  onNavigateToKind: (kind: BlockType) => void;
}

export function MetaModelView({ onNavigateToKind }: MetaModelViewProps) {
  const nodes = buildNodes();
  const edges = buildEdges();

  return (
    <div style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto" }}>
      <h1 style={headingStyle}>Meta-model</h1>
      <p style={subStyle}>
        How the pdt42 block types relate to each other. Click any node to open its chapter.
      </p>
      <div
        style={wrapStyle}
        role="img"
        aria-label="pdt42 meta-model: block types and their relationships across exploration, design, and growth phases"
      >
        <MetaModelDiagram
          nodes={nodes}
          edges={edges}
          width={SVG_W}
          height={SVG_H}
          onNodeClick={(id) => onNavigateToKind(id as BlockType)}
          ariaLabel="pdt42 meta-model: block types and their relationships across exploration, design, and growth phases"
        />
      </div>
    </div>
  );
}
