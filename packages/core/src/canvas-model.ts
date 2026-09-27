import type { CanvasView } from "./canvases.ts";
import {
  FLYWHEEL_LABELS,
  PATTERN_LABELS,
  PLAY_LABELS,
  ROLES,
  TACTIC_LABELS,
  canvasById,
} from "./methodology.ts";
import type { PayloadElement, WorkspacePayload } from "./payload.ts";
import { EVOLUTION, LAYERS, LEARNING_STAGES } from "./schemas.ts";

// What each canvas shows, derived from the model. Renderers (web, and later text or SVG
// exports) only lay this out; every item carries a `Ref` so it can link to its element.

export interface Ref {
  id: string;
  title: string;
  kind: string;
  /** The platform role of entities, for colouring. */
  role?: string;
}

type Data = Record<string, unknown>;

class Index {
  readonly payload: WorkspacePayload;
  readonly byId: Map<string, PayloadElement>;
  constructor(payload: WorkspacePayload) {
    this.payload = payload;
    this.byId = new Map(payload.elements.map((e) => [e.id, e]));
  }
  of(kind: string): PayloadElement[] {
    return this.payload.elements.filter((e) => e.kind === kind);
  }
  get(id: unknown): PayloadElement | undefined {
    return typeof id === "string" ? this.byId.get(id) : undefined;
  }
  ref(e: PayloadElement): Ref {
    const role = e.kind === "entity" ? (e.data.role as string | undefined) : undefined;
    return { id: e.id, title: e.title, kind: e.kind, ...(role ? { role } : {}) };
  }
  refOf(id: unknown): Ref | undefined {
    const e = this.get(id);
    return e ? this.ref(e) : undefined;
  }
  refsOf(ids: unknown): Ref[] {
    return (Array.isArray(ids) ? ids : []).flatMap((id) => this.refOf(id) ?? []);
  }
}

const str = (d: Data, key: string) => (typeof d[key] === "string" ? (d[key] as string) : undefined);
const list = (d: Data, key: string) => (Array.isArray(d[key]) ? (d[key] as string[]) : []);
const roleRank = (role: string | undefined) => {
  const i = ROLES.findIndex((r) => r.id === role);
  return i < 0 ? ROLES.length : i;
};

// ─── Exploration ─────────────────────────────────────────────────────────────

export interface ArenaScanModel {
  canvas: "arena-scan";
  enabled: Ref[];
  sequence: Ref[];
  enabling: Ref[];
  focus: string[];
  steps: { arena: Ref; steps: string[] }[];
}

function arenaScan(ix: Index): ArenaScanModel {
  const arenas = ix.of("arena");
  const enabledIds = new Set(arenas.flatMap((a) => list(a.data, "enables")));
  const enabling = arenas.filter((a) => list(a.data, "enables").length > 0);
  const enabled = arenas.filter((a) => enabledIds.has(a.id) && !enabling.includes(a));
  const rest = arenas.filter((a) => !enabling.includes(a) && !enabled.includes(a));
  // Sequence: order by the `after` relation (a simple topological sort, stable otherwise).
  const ordered: PayloadElement[] = [];
  const visit = (a: PayloadElement, seen: Set<string>) => {
    if (ordered.includes(a) || seen.has(a.id)) return;
    seen.add(a.id);
    for (const before of list(a.data, "after")) {
      const b = rest.find((r) => r.id === before);
      if (b) visit(b, seen);
    }
    ordered.push(a);
  };
  for (const a of rest) visit(a, new Set());
  const focus = arenas.filter((a) => a.data.focus === true);
  return {
    canvas: "arena-scan",
    enabled: enabled.map((a) => ix.ref(a)),
    sequence: ordered.map((a) => ix.ref(a)),
    enabling: enabling.map((a) => ix.ref(a)),
    focus: focus.map((a) => a.id),
    steps: focus.map((a) => ({ arena: ix.ref(a), steps: list(a.data, "steps") })),
  };
}

export interface LayerRow {
  layer: string;
  label: string;
  entities: Ref[];
  assets: Ref[];
  moats: Ref[];
}

const LAYER_LABELS: Record<string, string> = {
  "long-tail": "Long tail markets",
  aggregator: "Aggregators / platforms",
  infrastructure: "Infrastructures",
};

function layers(ix: Index, only?: Set<string>): LayerRow[] {
  return LAYERS.map((layer) => ({
    layer,
    label: LAYER_LABELS[layer]!,
    entities: ix
      .of("entity")
      .filter((e) => e.data.layer === layer && (!only || only.has(e.id)))
      .map((e) => ix.ref(e)),
    assets: ix
      .of("asset")
      .filter((e) => e.data.layer === layer)
      .map((e) => ix.ref(e)),
    moats: ix
      .of("moat")
      .filter((e) => e.data.layer === layer)
      .map((e) => ix.ref(e)),
  }));
}

export interface EcosystemScanModel {
  canvas: "ecosystem-scan";
  layers: LayerRow[];
  jobs: { job: Ref; arena?: Ref; entities: Ref[]; jobStep?: string }[];
  unplaced: Ref[];
}

function ecosystemScan(ix: Index): EcosystemScanModel {
  return {
    canvas: "ecosystem-scan",
    layers: layers(ix),
    jobs: ix.of("job").map((j) => ({
      job: ix.ref(j),
      arena: ix.refOf(j.data.arena),
      entities: ix.refsOf(j.data.entities),
      jobStep: str(j.data, "job-step"),
    })),
    unplaced: ix
      .of("entity")
      .filter(
        (e) =>
          !e.data.layer &&
          ix.payload.references.some((r) => r.to === e.id && ix.get(r.from)?.kind === "job"),
      )
      .map((e) => ix.ref(e)),
  };
}

export interface VrioModel {
  canvas: "vrio";
  assets: { asset: Ref; layer?: string; v: boolean; r: boolean; i: boolean; o: boolean }[];
}

function vrio(ix: Index): VrioModel {
  return {
    canvas: "vrio",
    assets: ix.of("asset").map((a) => {
      const level = str(a.data, "vrio") ?? "";
      return {
        asset: ix.ref(a),
        layer: str(a.data, "layer"),
        v: level.length >= 1,
        r: level.length >= 2,
        i: level.length >= 3,
        o: level.length >= 4,
      };
    }),
  };
}

export interface WardleyNode {
  ref: Ref;
  /** 0 (genesis) … 1 (commodity). */
  x: number;
  /** 0 (invisible) … 1 (user need). */
  y: number;
  /** To-be position after the platform plays. */
  targetX?: number;
  evolution?: string;
}

export interface WardleyModel {
  canvas: "wardley-map";
  arena?: Ref;
  nodes: WardleyNode[];
  links: { from: string; to: string }[];
  stages: string[];
}

const stageX = (stage: string | undefined) => {
  const i = EVOLUTION.indexOf(stage as (typeof EVOLUTION)[number]);
  return i < 0 ? undefined : (i + 0.5) / EVOLUTION.length;
};

function wardley(ix: Index, of: string | undefined): WardleyModel {
  const components = ix.of("component").filter((c) => !of || c.data.arena === of);
  const nodes = components.map((c, i) => ({
    ref: ix.ref(c),
    // Spread components of the same stage a little so labels do not collide.
    x: (stageX(str(c.data, "evolution")) ?? 0.5) + ((i % 3) - 1) * 0.03,
    y: typeof c.data.visibility === "number" ? (c.data.visibility as number) / 100 : 0.5,
    targetX: stageX(str(c.data, "target")),
    evolution: str(c.data, "evolution"),
  }));
  const ids = new Set(components.map((c) => c.id));
  return {
    canvas: "wardley-map",
    arena: ix.refOf(of),
    nodes,
    links: components.flatMap((c) =>
      list(c.data, "needs")
        .filter((n) => ids.has(n))
        .map((to) => ({ from: c.id, to })),
    ),
    stages: [...EVOLUTION],
  };
}

export interface PlatformPlaysModel {
  canvas: "platform-plays";
  plays: { id: string; label: string; applied: { play: Ref; insight: string; affects: Ref[] }[] }[];
}

function platformPlays(ix: Index): PlatformPlaysModel {
  return {
    canvas: "platform-plays",
    plays: Object.entries(PLAY_LABELS).map(([id, label]) => ({
      id,
      label,
      applied: ix
        .of("play")
        .filter((p) => p.data.play === id)
        .map((p) => ({
          play: ix.ref(p),
          insight: str(p.data, "insight") ?? "",
          affects: ix.refsOf(p.data.affects),
        })),
    })),
  };
}

export interface PatternCardsModel {
  canvas: "pattern-cards";
  cards: { id: string; label: string; scenarios: Ref[] }[];
}

function patternCards(ix: Index): PatternCardsModel {
  return {
    canvas: "pattern-cards",
    cards: Object.entries(PATTERN_LABELS).map(([id, label]) => ({
      id,
      label,
      scenarios: ix
        .of("scenario")
        .filter((s) => s.data.pattern === id)
        .map((s) => ix.ref(s)),
    })),
  };
}

export interface BriefModel {
  canvas: "brief-consolidation";
  layers: LayerRow[];
  scenarios: { scenario: Ref; pattern: string; impact?: string }[];
  brief?: {
    ref: Ref;
    arena?: Ref;
    entities: Ref[];
    standardize: string[];
    productSide: string[];
    moats: Ref[];
  };
}

function brief(ix: Index): BriefModel {
  const b = ix.of("brief")[0];
  return {
    canvas: "brief-consolidation",
    layers: layers(ix),
    scenarios: ix.of("scenario").map((s) => ({
      scenario: ix.ref(s),
      pattern: `${String(s.data.pattern).toUpperCase()} · ${PATTERN_LABELS[String(s.data.pattern)] ?? ""}`,
      impact: str(s.data, "impact"),
    })),
    brief: b && {
      ref: ix.ref(b),
      arena: ix.refOf(b.data.arena),
      entities: ix.refsOf(b.data.entities),
      standardize: list(b.data, "standardize"),
      productSide: list(b.data, "product-side"),
      moats: ix.refsOf(b.data.moats),
    },
  };
}

// ─── Design ──────────────────────────────────────────────────────────────────

export interface EcosystemModel {
  canvas: "ecosystem";
  name: string;
  /** From the outermost ring (stakeholders) to the core (owners). */
  rings: { role: string; label: string; code: string; entities: Ref[] }[];
  unassigned: Ref[];
}

function ecosystem(ix: Index): EcosystemModel {
  const order = ["stakeholder", "peer-consumer", "peer-producer", "partner", "owner"];
  const name = ix.of("ecosystem")[0]?.title ?? ix.of("platform")[0]?.title ?? ix.payload.name;
  return {
    canvas: "ecosystem",
    name,
    rings: order.map((role) => {
      const info = ROLES.find((r) => r.id === role)!;
      return {
        role,
        label: info.label,
        code: info.code,
        entities: ix
          .of("entity")
          .filter((e) => e.data.role === role)
          .map((e) => ix.ref(e)),
      };
    }),
    unassigned: ix
      .of("entity")
      .filter((e) => !e.data.role)
      .map((e) => ix.ref(e)),
  };
}

export interface PortraitModel {
  canvas: "entity-portrait";
  entity?: Ref;
  type?: string;
  clusters: string[];
  context: string[];
  assets: string[];
  capabilities: string[];
  potential: string[];
  pressures: string[];
  goals: string[];
  convenience: string[];
  reach: string[];
  value: string[];
}

function portrait(ix: Index, of: string | undefined): PortraitModel {
  const e = ix.get(of);
  const d = e?.data ?? {};
  return {
    canvas: "entity-portrait",
    entity: e && ix.ref(e),
    type: str(d, "type"),
    clusters: list(d, "clusters"),
    context: list(d, "context"),
    assets: list(d, "assets"),
    capabilities: list(d, "capabilities"),
    potential: list(d, "potential"),
    pressures: list(d, "pressures"),
    goals: list(d, "goals"),
    convenience: list(d, "convenience-gains"),
    reach: list(d, "reach-gains"),
    value: list(d, "value-gains"),
  };
}

export interface MatrixItem {
  ref: Ref;
  gives: string;
  status?: string;
  kind?: string;
}

export interface MotivationsModel {
  canvas: "motivations-matrix";
  roles: Ref[];
  cells: { from: string; to: string; items: MatrixItem[] }[];
}

function motivations(ix: Index): MotivationsModel {
  const ms = ix.of("motivation");
  const involved = new Set(ms.flatMap((m) => [m.data.from, m.data.to]));
  const roles = ix
    .of("entity")
    .filter((e) => involved.has(e.id))
    .sort((a, b) => roleRank(a.data.role as string) - roleRank(b.data.role as string))
    .map((e) => ix.ref(e));
  const cells = new Map<string, MatrixItem[]>();
  for (const m of ms) {
    const key = `${String(m.data.from)}>${String(m.data.to)}`;
    cells.set(key, [
      ...(cells.get(key) ?? []),
      {
        ref: ix.ref(m),
        gives: str(m.data, "gives") ?? "",
        status: str(m.data, "status"),
        kind: str(m.data, "kind"),
      },
    ]);
  }
  return {
    canvas: "motivations-matrix",
    roles,
    cells: [...cells].map(([key, items]) => {
      const [from, to] = key.split(">") as [string, string];
      return { from, to, items };
    }),
  };
}

export interface BoardRow {
  ref: Ref;
  happening: boolean;
  /** Arrow between role 1 (left) and role 2 (right). */
  arrow: "→" | "←" | "↔";
  valueUnit?: string;
  kind?: string;
  channel?: Ref;
  components: string[];
  improvement?: string;
}

export interface BoardModel {
  canvas: "transactions-board";
  relationship?: Ref;
  roles: [Ref | undefined, Ref | undefined];
  rows: BoardRow[];
}

function board(ix: Index, of: string | undefined): BoardModel {
  const r = ix.get(of);
  const between = r ? list(r.data, "between") : [];
  const role1 = between[0];
  return {
    canvas: "transactions-board",
    relationship: r && ix.ref(r),
    roles: [ix.refOf(between[0]), ix.refOf(between[1])],
    rows: ix
      .of("transaction")
      .filter((t) => t.data.relationship === of)
      .map((t) => {
        const channel = ix.get(t.data.channel);
        return {
          ref: ix.ref(t),
          happening: t.data.happening === true,
          arrow: t.data.direction === "two-way" ? "↔" : t.data.from === role1 ? "→" : "←",
          valueUnit: str(t.data, "value-unit"),
          kind: str(t.data, "kind"),
          channel: channel && ix.ref(channel),
          components: channel ? list(channel.data, "components") : [],
          improvement: channel ? str(channel.data, "improvement") : undefined,
        };
      }),
  };
}

export interface LearningModel {
  canvas: "learning-engine";
  stages: { id: string; label: string }[];
  rows: {
    engine: Ref;
    entity?: Ref;
    entry: string[];
    stages: { stage: string; challenges: string[]; services: Ref[] }[];
    evolvesTo: Ref[];
  }[];
}

const STAGE_LABELS: Record<string, string> = {
  onboarding: "Onboarding the platform",
  "getting-better": "Getting better on the platform",
  "new-opportunity": "Catching the new opportunity",
};

function learning(ix: Index): LearningModel {
  return {
    canvas: "learning-engine",
    stages: LEARNING_STAGES.map((id) => ({ id, label: STAGE_LABELS[id]! })),
    rows: ix
      .of("learning-engine")
      .sort(
        (a, b) =>
          roleRank(ix.get(a.data.entity)?.data.role as string) -
          roleRank(ix.get(b.data.entity)?.data.role as string),
      )
      .map((le) => ({
        engine: ix.ref(le),
        entity: ix.refOf(le.data.entity),
        entry: list(le.data, "entry"),
        stages: LEARNING_STAGES.map((stage) => ({
          stage,
          challenges: list(le.data, stage),
          services: ix
            .of("service")
            .filter(
              (s) => s.data.stage === stage && list(s.data, "for").includes(String(le.data.entity)),
            )
            .map((s) => ix.ref(s)),
        })),
        evolvesTo: ix.refsOf(le.data["evolves-to"]),
      })),
  };
}

export interface ExperienceModel {
  canvas: "platform-experience";
  experience?: Ref;
  relationship?: Ref;
  core?: Ref;
  roles: Ref[];
  valueProposition?: string;
  lanes: { channel?: Ref; label: string }[];
  steps: {
    ref: Ref;
    brick: "transaction" | "service";
    lane: number;
    from?: Ref;
    to?: Ref;
    for: Ref[];
  }[];
  activities: string[];
  resources: string[];
  costs: string[];
  revenues: string[];
}

function experience(ix: Index, of: string | undefined): ExperienceModel {
  const x = ix.get(of);
  const d = x?.data ?? {};
  const bricks = list(d, "steps").flatMap((id) => ix.get(id) ?? []);
  const laneIds: (string | undefined)[] = [];
  for (const b of bricks) {
    const ch = str(b.data, "channel");
    if (!laneIds.includes(ch)) laneIds.push(ch);
  }
  // Lanes with a channel first, in order of appearance; steps without a channel last.
  laneIds.sort((a, b) => (a === undefined ? 1 : 0) - (b === undefined ? 1 : 0));
  return {
    canvas: "platform-experience",
    experience: x && ix.ref(x),
    relationship: ix.refOf(d.relationship),
    core: ix.refOf(d["core-entity"]),
    roles: ix.refsOf(d.roles),
    valueProposition: str(d, "value-proposition"),
    lanes: laneIds.map((id) => {
      const ch = ix.refOf(id);
      return ch ? { channel: ch, label: ch.title } : { label: "No channel" };
    }),
    steps: bricks.map((b) => ({
      ref: ix.ref(b),
      brick: b.kind === "service" ? "service" : "transaction",
      lane: laneIds.indexOf(str(b.data, "channel")),
      from: ix.refOf(b.data.from),
      to: ix.refOf(b.data.to),
      for: ix.refsOf(b.data.for),
    })),
    activities: list(d, "activities"),
    resources: list(d, "resources"),
    costs: list(d, "costs"),
    revenues: list(d, "revenues"),
  };
}

export interface MvpModel {
  canvas: "mvp";
  mvp?: Ref;
  experiences: Ref[];
  base: string[];
  implementation?: string;
  status?: string;
  assumptions: {
    ref: Ref;
    kind?: string;
    riskiest: boolean;
    test?: string;
    criteria?: string;
    status?: string;
  }[];
}

function mvp(ix: Index, of: string | undefined): MvpModel {
  const m = ix.get(of);
  const d = m?.data ?? {};
  return {
    canvas: "mvp",
    mvp: m && ix.ref(m),
    experiences: ix.refsOf(d.experiences),
    base: list(d, "base"),
    implementation: str(d, "implementation"),
    status: str(d, "status"),
    assumptions: ix
      .of("assumption")
      .filter((a) => a.data.mvp === of)
      .sort((a, b) => Number(b.data.riskiest === true) - Number(a.data.riskiest === true))
      .map((a) => ({
        ref: ix.ref(a),
        kind: str(a.data, "kind"),
        riskiest: a.data.riskiest === true,
        test: str(a.data, "test"),
        criteria: str(a.data, "criteria"),
        status: str(a.data, "status"),
      })),
  };
}

export interface PlatformDesignModel {
  canvas: "platform-design";
  owners: Ref[];
  stakeholders: Ref[];
  enabling: Ref[];
  empowering: Ref[];
  other: Ref[];
  coreValue?: string;
  ancillary: string[];
  infrastructure: string[];
  transactions: Ref[];
  channels: Ref[];
  partners: Ref[];
  producers: Ref[];
  consumers: Ref[];
}

function platformDesign(ix: Index): PlatformDesignModel {
  const p = ix.of("platform")[0];
  const byRole = (role: string) =>
    ix
      .of("entity")
      .filter((e) => e.data.role === role)
      .map((e) => ix.ref(e));
  const services = (kind: string) =>
    ix
      .of("service")
      .filter((s) => s.data.kind === kind)
      .map((s) => ix.ref(s));
  return {
    canvas: "platform-design",
    owners: byRole("owner"),
    stakeholders: byRole("stakeholder"),
    enabling: services("enabling"),
    empowering: services("empowering"),
    other: services("other"),
    coreValue: p && str(p.data, "core-value"),
    ancillary: p ? list(p.data, "ancillary-values") : [],
    infrastructure: p ? list(p.data, "infrastructure") : [],
    transactions: ix.of("transaction").map((t) => ix.ref(t)),
    channels: ix.of("channel").map((c) => ix.ref(c)),
    partners: byRole("partner"),
    producers: byRole("peer-producer"),
    consumers: byRole("peer-consumer"),
  };
}

// ─── Growth ──────────────────────────────────────────────────────────────────

export interface ValuePropositionItem {
  ref: Ref;
  customer?: Ref;
  relationship?: Ref;
  mechanism?: string;
  bundle: string[];
}

export interface StrategyModel {
  canvas: "platform-strategy-model";
  product: ValuePropositionItem[];
  marketplaces: ValuePropositionItem[];
  extension: ValuePropositionItem[];
}

function strategyModel(ix: Index): StrategyModel {
  const vps = (kind: string) =>
    ix
      .of("value-proposition")
      .filter((v) => v.data.kind === kind)
      .map((v) => ({
        ref: ix.ref(v),
        customer: ix.refOf(v.data.customer),
        relationship: ix.refOf(v.data.relationship),
        mechanism: str(v.data, "mechanism"),
        bundle: list(v.data, "bundle"),
      }));
  return {
    canvas: "platform-strategy-model",
    product: vps("product"),
    marketplaces: vps("marketplace"),
    extension: vps("extension"),
  };
}

const PROPERTIES: { key: string; label: string; options: string[] }[] = [
  { key: "supply", label: "Supply", options: ["commoditized", "differentiated"] },
  { key: "symmetry", label: "Core relationship", options: ["symmetric", "asymmetric"] },
  { key: "location", label: "Location", options: ["local", "regional", "global"] },
  { key: "tenancy", label: "Tenancy", options: ["single", "multi"] },
  { key: "frequency", label: "Transaction frequency", options: ["low", "medium", "high"] },
  { key: "value", label: "Transaction value", options: ["low", "medium", "high"] },
  { key: "exclusivity", label: "Relationship", options: ["monogamous", "polygamous"] },
];

export interface NetworkModel {
  canvas: "network-properties";
  relationship?: Ref;
  network?: Ref;
  properties: { key: string; label: string; options: string[]; value?: string }[];
  curve?: string;
  tactics: { id: string; label: string }[];
}

function network(ix: Index, of: string | undefined): NetworkModel {
  const n = ix.of("network").find((e) => e.data.relationship === of);
  const d = n?.data ?? {};
  return {
    canvas: "network-properties",
    relationship: ix.refOf(of),
    network: n && ix.ref(n),
    properties: PROPERTIES.map((p) => ({ ...p, value: str(d, p.key) })),
    curve: str(d, "curve"),
    tactics: list(d, "tactics").map((id) => ({ id, label: TACTIC_LABELS[id] ?? id })),
  };
}

export interface FlywheelModel {
  canvas: "flywheel-sketching";
  flywheels: {
    ref: Ref;
    type?: string;
    typeLabel: string;
    core: boolean;
    loop: string[];
    bottleneck?: string;
    metric?: string;
    relationship?: Ref;
    reinforces?: Ref;
  }[];
}

function flywheels(ix: Index): FlywheelModel {
  return {
    canvas: "flywheel-sketching",
    flywheels: ix
      .of("flywheel")
      .map((f) => {
        const type = str(f.data, "type");
        return {
          ref: ix.ref(f),
          type,
          typeLabel: FLYWHEEL_LABELS[type ?? ""] ?? type ?? "",
          core: type === "direct-network" || type === "indirect-network",
          loop: list(f.data, "loop"),
          bottleneck: str(f.data, "bottleneck"),
          metric: str(f.data, "metric"),
          relationship: ix.refOf(f.data.relationship),
          reinforces: ix.refOf(f.data.reinforces),
        };
      })
      .sort((a, b) => Number(b.core) - Number(a.core)),
  };
}

export interface LiquidityModel {
  canvas: "liquidity";
  relationship?: Ref;
  plan?: Ref;
  alternatives: string[];
  supplyThreshold?: string;
  demandThreshold?: string;
  canonicalUnit?: string;
  constraints: string[];
  startWith?: string;
}

function liquidity(ix: Index, of: string | undefined): LiquidityModel {
  const l = ix.of("liquidity").find((e) => e.data.relationship === of);
  const d = l?.data ?? {};
  return {
    canvas: "liquidity",
    relationship: ix.refOf(of),
    plan: l && ix.ref(l),
    alternatives: list(d, "alternatives"),
    supplyThreshold: str(d, "supply-threshold"),
    demandThreshold: str(d, "demand-threshold"),
    canonicalUnit: str(d, "canonical-unit"),
    constraints: list(d, "constraints"),
    startWith: str(d, "start-with"),
  };
}

export interface GrowthModel {
  canvas: "growth-model";
  loops: {
    ref: Ref;
    type?: string;
    equation?: string;
    bottleneck?: string;
    cycleTime?: string;
    metric?: string;
    acquires?: Ref;
    feeds?: Ref;
  }[];
}

function growthModel(ix: Index): GrowthModel {
  return {
    canvas: "growth-model",
    loops: ix.of("growth-loop").map((g) => ({
      ref: ix.ref(g),
      type: str(g.data, "type"),
      equation: str(g.data, "equation"),
      bottleneck: str(g.data, "bottleneck"),
      cycleTime: str(g.data, "cycle-time"),
      metric: str(g.data, "metric"),
      acquires: ix.refOf(g.data.acquires),
      feeds: ix.refOf(g.data.feeds),
    })),
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export type CanvasModel =
  | ArenaScanModel
  | EcosystemScanModel
  | VrioModel
  | WardleyModel
  | PlatformPlaysModel
  | PatternCardsModel
  | BriefModel
  | EcosystemModel
  | PortraitModel
  | MotivationsModel
  | BoardModel
  | LearningModel
  | ExperienceModel
  | MvpModel
  | PlatformDesignModel
  | StrategyModel
  | NetworkModel
  | FlywheelModel
  | LiquidityModel
  | GrowthModel;

/** The content of a placed canvas, derived from the model. */
export function drawCanvas(
  payload: WorkspacePayload,
  view: Pick<CanvasView, "canvas" | "of">,
): CanvasModel | undefined {
  if (!canvasById(view.canvas)) return undefined;
  const ix = new Index(payload);
  switch (view.canvas) {
    case "arena-scan":
      return arenaScan(ix);
    case "ecosystem-scan":
      return ecosystemScan(ix);
    case "vrio":
      return vrio(ix);
    case "wardley-map":
      return wardley(ix, view.of);
    case "platform-plays":
      return platformPlays(ix);
    case "pattern-cards":
      return patternCards(ix);
    case "brief-consolidation":
      return brief(ix);
    case "ecosystem":
      return ecosystem(ix);
    case "entity-portrait":
      return portrait(ix, view.of);
    case "motivations-matrix":
      return motivations(ix);
    case "transactions-board":
      return board(ix, view.of);
    case "learning-engine":
      return learning(ix);
    case "platform-experience":
      return experience(ix, view.of);
    case "mvp":
      return mvp(ix, view.of);
    case "platform-design":
      return platformDesign(ix);
    case "platform-strategy-model":
      return strategyModel(ix);
    case "network-properties":
      return network(ix, view.of);
    case "flywheel-sketching":
      return flywheels(ix);
    case "liquidity":
      return liquidity(ix, view.of);
    case "growth-model":
      return growthModel(ix);
    default:
      return undefined;
  }
}
