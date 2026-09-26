// Zod schemas for every pdt block type: the single source of truth for fields, required/optional,
// enum values, cross-references and authoring guidance. Nothing is duplicated elsewhere —
// `explain`, the validator, `guide` and the canvases all read these schemas and their metadata.
//
// Field metadata (`FieldMeta`) is attached by the field helpers below; block metadata
// (`BlockMeta`) by `block()`. Both live in zod's global registry via `.meta()`.

import { z } from "zod";
import type { RawValue } from "./ast.ts";

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

export const ROLE_IDS = ["owner", "stakeholder", "peer-consumer", "peer-producer", "partner"] as const;
export const PEER_ROLES = ["peer-consumer", "peer-producer", "partner"] as const;
export const LAYERS = ["long-tail", "aggregator", "infrastructure"] as const;
export const JOB_STEPS = ["define", "locate", "prepare", "confirm", "execute", "monitor", "modify", "conclude"] as const;
export const VALUE_KINDS = [
  "money",
  "reputation",
  "feedback",
  "knowledge",
  "goods",
  "services",
  "attention",
  "data",
  "access",
  "other",
] as const;
export const EVOLUTION = ["genesis", "custom", "product", "commodity"] as const;
export const PLAYS = ["pp1", "pp2", "pp3", "pp4", "pp5", "pp6"] as const;
export const PATTERNS = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"] as const;
export const LEARNING_STAGES = ["onboarding", "getting-better", "new-opportunity"] as const;
export const TACTICS = [
  "trust",
  "marquee",
  "single-user-value",
  "virality",
  "nesting",
  "hyper-targeting",
  "remnant-inventory",
  "scraping",
  "subsidize",
  "community-content",
] as const;
export const FLYWHEEL_TYPES = ["direct-network", "indirect-network", "scale", "brand", "tech", "data", "lock-in"] as const;
export const LOOP_TYPES = ["viral", "paid", "content", "ugc", "sales"] as const;

// ---------------------------------------------------------------------------
// Field helpers — each attaches FieldMeta so tooling can reason about the field
// ---------------------------------------------------------------------------

export type FieldKind = "text" | "list" | "ref" | "refs" | "enum" | "enums" | "flag" | "number";

export interface FieldMeta {
  kind: FieldKind;
  description: string;
  required: boolean;
  /** Target block types of ref/refs fields. */
  target?: string[];
  /** Allowed values of enum/enums/flag fields. */
  values?: readonly string[];
}

const raw = z.union([z.string(), z.array(z.string())]);

const asString = (v: RawValue) => (Array.isArray(v) ? v.join(", ") : v).trim();
const asList = (v: RawValue) => (Array.isArray(v) ? v : v.trim() === "" ? [] : [v]).map((s) => s.trim()).filter(Boolean);
const asRefs = (v: RawValue) =>
  (Array.isArray(v) ? v : v.split(","))
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);

function field<T extends z.ZodType>(schema: T, meta: FieldMeta) {
  return schema.meta({ pdt: meta });
}

/** Single line of text. */
export function text(description: string, required = false) {
  const s = raw.transform(asString).pipe(required ? z.string().min(1, "must not be empty") : z.string());
  return field(required ? s : s.optional(), { kind: "text", description, required });
}

/** Several short statements — one sticky note each. Written as `- item` lines. */
export function list(description: string) {
  return field(raw.transform(asList).optional().default([]), { kind: "list", description, required: false });
}

/** Reference to one element of the given type(s). */
export function ref(target: string | string[], description: string, required = false) {
  const s = raw.transform(asString).pipe(required ? z.string().min(1, "must not be empty") : z.string());
  return field(required ? s : s.optional(), {
    kind: "ref",
    description,
    required,
    target: ([] as string[]).concat(target),
  });
}

/** References to several elements, comma-separated; order matters where noted. */
export function refs(target: string | string[], description: string, required = false) {
  const s = raw.transform(asRefs);
  return field(required ? s.pipe(z.array(z.string()).min(1, "needs at least one reference")) : s.optional().default([]), {
    kind: "refs",
    description,
    required,
    target: ([] as string[]).concat(target),
  });
}

/** One of a fixed set of values. */
export function oneOf<const V extends readonly [string, ...string[]]>(values: V, description: string, required = false) {
  const s = raw.transform(asString).pipe(z.enum(values));
  return field(required ? s : s.optional(), { kind: "enum", description, required, values });
}

/** Several values from a fixed set, comma-separated. */
export function someOf<const V extends readonly [string, ...string[]]>(values: V, description: string) {
  return field(raw.transform(asRefs).pipe(z.array(z.enum(values))).optional().default([]), {
    kind: "enums",
    description,
    required: false,
    values,
  });
}

/** yes/no, read as a boolean. */
export function flag(description: string) {
  return field(raw.transform(asString).pipe(z.enum(["yes", "no"])).transform((v) => v === "yes").optional(), {
    kind: "flag",
    description,
    required: false,
    values: ["yes", "no"],
  });
}

/** A number within bounds. */
export function number(description: string, min: number, max: number) {
  return field(raw.transform(asString).pipe(z.coerce.number().min(min).max(max)).optional(), {
    kind: "number",
    description,
    required: false,
  });
}

const id = () => text("Unique identifier, used in references", true);
const title = () => text("Human-readable name", true);

// ---------------------------------------------------------------------------
// Block metadata
// ---------------------------------------------------------------------------

export type Phase = "exploration" | "design" | "growth";

export interface BlockMeta {
  /** What the block is, in one sentence. */
  description: string;
  /** The methodology step that introduces the block (see methodology.ts). */
  step: string;
  /** At most one per workspace. */
  singleton?: boolean;
  /** Authoring guidance, in our own words, grounded in PDT 2.2. */
  tips: string[];
  /** A minimal, valid example body (attributes only). */
  example: string;
}

function block<T extends z.ZodRawShape>(shape: T, meta: BlockMeta) {
  return z.object(shape).meta({ pdtBlock: meta });
}

// ---------------------------------------------------------------------------
// Exploration
// ---------------------------------------------------------------------------

export const EcosystemSchema = block(
  {
    id: id(),
    title: title(),
    context: oneOf(
      ["ecosystem-mobilization", "product-service-innovation"],
      "Why you look at this ecosystem: mobilising an ecosystem that under-performs, or taking an existing offering up the value chain",
    ),
  },
  {
    description: "The broad context of interactions you explore — the starting point of the whole design.",
    step: "E1",
    singleton: true,
    tips: [
      "Describe in prose who creates and exchanges value today — you cannot design for an ecosystem that does not exist.",
      "Name the context honestly: most real cases mix ecosystem mobilisation and product/service innovation.",
    ],
    example: "id: eco-food\ntitle: Regional food system\ncontext: ecosystem-mobilization",
  },
);

export const ArenaSchema = block(
  {
    id: id(),
    title: title(),
    outcome: text("The systemic outcome the entities in this arena reach together"),
    after: refs("arena", "Arenas that come before this one (sequence: before → after)"),
    enables: refs("arena", "Arenas this one enables (layer: enabling → enabled)"),
    focus: flag("In your FOCUS area: an arena you can act on, not necessarily the most important one"),
    steps: list("Steps of the systemic interaction — the experiences to scan next"),
  },
  {
    description: "A cluster of systemic jobs-to-be-done inside the ecosystem, reached by roughly ten entities together.",
    step: "E1",
    tips: [
      "Phases with a clear before/after make good arenas; so do layers where one arena enables another.",
      "An arena rarely has more than ten roles and a step two to five — if a step involves twenty, promote it to an arena.",
      "The universal job map (define, locate, prepare, confirm, execute, monitor, modify, conclude) helps find steps.",
    ],
    example: "id: ar-selling\ntitle: Selling the harvest\noutcome: Produce reaches a kitchen at a fair price\nfocus: yes\nsteps:\n  - Find buyers\n  - Agree quantities\n  - Deliver",
  },
);

export const JobSchema = block(
  {
    id: id(),
    title: title(),
    arena: ref("arena", "The arena whose step this is", true),
    entities: refs("entity", "The entities that take part"),
    "job-step": oneOf(JOB_STEPS, "Where it sits in the universal job map"),
  },
  {
    description: "An experience that already happens in the ecosystem — a step of an arena, placed on the Ecosystem Scan.",
    step: "E2",
    tips: [
      "Enumerate the most frequent or valuable experiences first, among the most relevant entities.",
      "Scan after getting out of the building: a round of open interviews beats desk research.",
    ],
    example: "id: j-find-buyers\ntitle: Find buyers for the week's harvest\narena: ar-selling\nentities: e-farmers, e-restaurants\njob-step: locate",
  },
);

export const EntitySchema = block(
  {
    id: id(),
    title: title(),
    role: oneOf(ROLE_IDS, "The platform role this entity-role plays"),
    layer: oneOf(LAYERS, "Where it sits on the Ecosystem Scan: long-tail niche, aggregator/mediator, or infrastructure"),
    type: text("What kind of entity it is: individuals, SMBs, institutions …"),
    clusters: list("The concrete entities clustered into this role (a GP and a nurse → healthcare professionals)"),
    context: list("Its environment, tools, constraints and daily reality"),
    assets: list("Potential: assets it owns and could leverage"),
    capabilities: list("Potential: capabilities it could leverage"),
    potential: list("Potential: how it could grow or evolve"),
    goals: list("Compressor: what it is trying to achieve right now"),
    pressures: list("Compressor: the performance pressures pushing it to improve"),
    "convenience-gains": list("Gains sought: easier, faster, cheaper ways of doing things"),
    "reach-gains": list("Gains sought: access and reach — its 'other half of the apple'"),
    "value-gains": list("Gains sought: money, savings, recognition, knowledge, security …"),
  },
  {
    description: "An entity-role: a cluster of similar ecosystem actors, with its platform role and its portrait.",
    step: "D1",
    tips: [
      "Cluster similar entities under one role name — losing detail lets more of the ecosystem take part.",
      "Keep at most five roles in the peer spectrum (peer consumers, peer producers, partners).",
      "Ask 'how many of them are there?' — if you can name only one or two, it is probably not a peer.",
      "Portrait: start from potential, then the compressors (goals, pressures), then the gains.",
      "Map the gains they seek in their current experience, not the gains you plan to offer.",
    ],
    example:
      "id: e-farmers\ntitle: Small-scale farmers\nrole: peer-producer\ntype: family businesses\nclusters:\n  - Vegetable growers\n  - Orchards\npressures:\n  - Volatile demand\nconvenience-gains:\n  - Selling without driving to town",
  },
);

export const AssetSchema = block(
  {
    id: id(),
    title: title(),
    vrio: oneOf(["v", "vr", "vri", "vrio"], "How far it passes the ordered VRIO test: Valuable, Rare, Inimitable, Organised", true),
    layer: oneOf(LAYERS, "The market layer the asset plays at"),
    "relates-to": refs(["entity", "job"], "The entities or experiences it is positioned next to on the Ecosystem Scan"),
  },
  {
    description: "An asset or capability of the shaping organisation that could ground an advantage.",
    step: "E3",
    tips: [
      "Run the questions strictly in order: an asset must be valuable before rare, rare before inimitable.",
      "Look at every layer: user cohorts you reach, activities you facilitate, technology you own.",
    ],
    example: "id: as-cold-chain\ntitle: Refrigerated vans and depot\nvrio: vri\nlayer: infrastructure",
  },
);

export const MoatSchema = block(
  {
    id: id(),
    title: title(),
    kind: oneOf(["demand-aggregator", "supply-aggregator", "regulated", "other"], "What makes it hard to displace", true),
    holder: ref("entity", "The entity that holds the moat"),
    layer: oneOf(LAYERS, "The market layer of the moat"),
    arena: ref("arena", "The arena it dominates"),
  },
  {
    description: "A dominant position in the ecosystem: an established aggregator or a regulated, permissioned player.",
    step: "E3",
    tips: [
      "To spot a moat, look for alternative routes to the same value flow — if none exist, a moat is there.",
      "Don't plan to replace moats; ask how to streamline the interaction with them or turn them into partners.",
    ],
    example: "id: mo-wholesale\ntitle: Regional wholesale market\nkind: demand-aggregator\nlayer: aggregator",
  },
);

export const ComponentSchema = block(
  {
    id: id(),
    title: title(),
    arena: ref("arena", "The arena whose value chain this component belongs to"),
    visibility: number("Visibility towards the user, 0 (invisible) to 100 (the user need itself)", 0, 100),
    evolution: oneOf(EVOLUTION, "Evolution today: genesis, custom, product or commodity"),
    target: oneOf(EVOLUTION, "Evolution after the platform plays (to-be value chain)"),
    needs: refs("component", "Components this one depends on (lower in the chain)"),
    entity: ref("entity", "The entity this component stands for, if any"),
  },
  {
    description: "A node of the arena's value chain on the Wardley Map: positioned by visibility and evolution.",
    step: "E5",
    tips: [
      "Place visibility first (top to bottom), evolution second.",
      "Unbundle into atoms: a gym becomes instructor, machines and real estate — each with its own evolution.",
      "An industrial, pipeline value chain looks like a C; the platform plays turn it into a Z.",
    ],
    example: "id: c-delivery\ntitle: Last-mile delivery\nvisibility: 40\nevolution: custom\ntarget: product\nneeds: c-vans",
  },
);

export const PlaySchema = block(
  {
    id: id(),
    play: oneOf(PLAYS, "Which of the six Platform Plays", true),
    arena: ref("arena", "The arena whose value chain the play transforms"),
    affects: refs("component", "Components the play moves on the map"),
    insight: text("What the play reveals: transactions to standardise, what to bundle, who moves up", true),
  },
  {
    description: "The application of one Platform Play to the arena's value chain, and what it reveals.",
    step: "E6",
    tips: [
      "Apply one play at a time and move the components accordingly.",
      "The plays are a library, not a checklist — keep only those with a real impact here.",
      "Note transaction standardisation and product-side insights: they feed the transactions engine.",
    ],
    example: "id: pl-producers-up\nplay: pp2\ninsight: Farmers are hidden behind wholesalers; bring them to the top as users",
  },
);

export const ScenarioSchema = block(
  {
    id: id(),
    title: title(),
    pattern: oneOf(PATTERNS, "The Pattern of Platformization (E1–E12) behind the what-if", true),
    arena: ref("arena", "The arena the scenario plays out in"),
    impact: text("What would change if the pattern played out here"),
  },
  {
    description: "A WHAT-IF scenario generated by playing a Pattern Card against the mapped landscape.",
    step: "E7",
    tips: ["Play only the cards whose signal is visible in the landscape.", "Same card name, different layer, different move — read the layer first."],
    example: "id: sc-profession\ntitle: Hosts of pick-up points become a profession\npattern: e4",
  },
);

export const BriefSchema = block(
  {
    id: id(),
    title: title(),
    arena: ref("arena", "The arena chosen as the platformization space", true),
    entities: refs("entity", "The entities that seed the Ecosystem Canvas"),
    standardize: list("Transactions to standardise"),
    "product-side": list("Key traits of the product side (SaaS, service bundle)"),
    moats: refs("moat", "Dominant players to reckon with"),
  },
  {
    description: "The consolidated strategic brief that closes exploration and opens strategy design.",
    step: "E7",
    singleton: true,
    tips: [
      "Focus the space on a core two-sided relationship; other entities can play ancillary roles.",
      "When the value chain splits into sub-chains (hardware/software, rentals/experiences), pick one space.",
    ],
    example: "id: br-main\ntitle: Planned harvests for local kitchens\narena: ar-selling\nentities: e-farmers, e-restaurants",
  },
);

// ---------------------------------------------------------------------------
// Design
// ---------------------------------------------------------------------------

export const PlatformSchema = block(
  {
    id: id(),
    title: title(),
    narrative: text("The new rules of the game the platform offers the ecosystem"),
    owners: refs("entity", "Entity-roles that own or shape the platform strategy"),
    "core-entity": ref("entity", "The entity-role whose point of view comes first"),
    "core-value": text("The core value proposition for the core target"),
    "ancillary-values": list("Secondary value propositions"),
    infrastructure: list("Infrastructures and core components the owners run"),
  },
  {
    description: "The platform strategy: its narrative, owners, core entity and value propositions.",
    step: "D1",
    singleton: true,
    tips: [
      "The narrative should promise every participant an easier way to exchange value and to learn faster inside than outside.",
      "Choose the core entity in step D4, once portraits and motivations are known.",
    ],
    example: "id: platform-main\ntitle: Harvest Commons\nowners: e-coop\ncore-entity: e-farmers",
  },
);

export const MotivationSchema = block(
  {
    id: id(),
    from: ref("entity", "The entity-role that gives (matrix row)", true),
    to: ref("entity", "The entity-role that receives (matrix column)", true),
    gives: text("What `from` gives, or could give, to `to`", true),
    status: oneOf(["current", "potential"], "Already flowing today, or possible if enabled"),
    kind: oneOf(VALUE_KINDS, "The kind of value that flows"),
  },
  {
    description: "One cell of the Motivations Matrix: what one entity-role gives to another.",
    step: "D3",
    tips: [
      "Just ask 'what can A give to B?' — map divergently, don't judge.",
      "Cover different role types first, then the diagonal (peers of the same type).",
      "Always map money, reputation and feedback: they drive quality.",
      "Empty cells are a signal too.",
    ],
    example: "id: m-farmers-eaters\nfrom: e-farmers\nto: e-households\ngives: Vegetables picked the day before\nstatus: current\nkind: goods",
  },
);

export const RelationshipSchema = block(
  {
    id: id(),
    title: title(),
    between: refs("entity", "The two entity-roles in the relationship", true),
    core: flag("Part of the core system you design for in this iteration"),
  },
  {
    description: "A relationship between two entity-roles — the root of transactions boards and experiences.",
    step: "D4",
    tips: [
      "Pick one to three core relationships; a triangle often works well.",
      "Every entity in a core relationship needs a portrait — you will check the pull against it.",
    ],
    example: "id: r-farmer-kitchen\ntitle: Farmer ↔ restaurant\nbetween: e-farmers, e-restaurants\ncore: yes",
  },
);

export const ChannelSchema = block(
  {
    id: id(),
    title: title(),
    medium: oneOf(["digital", "physical", "hybrid"], "What the channel is made of"),
    components: list("Channel components: features, templates, contracts, events …"),
    improvement: text("How the channel lowers the transaction cost compared with today"),
  },
  {
    description: "Anything that makes an interaction easier to happen: an app, an event, a template, a contract.",
    step: "D5",
    tips: [
      "Don't think only in software: removing bureaucracy and unnecessary steps is often the bigger win.",
      "Describe the improvement as a reduction of transaction cost.",
    ],
    example: "id: ch-app\ntitle: Harvest app\nmedium: digital\ncomponents:\n  - Weekly availability list\n  - Standard pre-order contract",
  },
);

export const TransactionSchema = block(
  {
    id: id(),
    title: title(),
    relationship: ref("relationship", "The relationship whose Transactions Board this row belongs to"),
    from: ref("entity", "Role 1: where the value unit starts", true),
    to: ref("entity", "Role 2: where the value unit goes", true),
    direction: oneOf(["one-way", "two-way"], "One-way (from → to) or bi-directional"),
    "value-unit": text("The currency or unit of value exchanged — be specific"),
    happening: flag("Already happening in the ecosystem today"),
    channel: ref("channel", "The channel in which it happens"),
    kind: oneOf(VALUE_KINDS, "The kind of value exchanged"),
  },
  {
    description: "An elementary, atomic transaction between two entity-roles: one row of a Transactions Board.",
    step: "D5",
    tips: [
      "Name transactions as verbs — actions that can repeat at scale, like filling a form.",
      "Group two transactions only when they make no sense apart (book and pay in advance).",
      "Moving from value flows to value units is what later lets you attach a business model.",
    ],
    example:
      "id: t-preorder\ntitle: Pre-order the season's volumes\nrelationship: r-farmer-kitchen\nfrom: e-restaurants\nto: e-farmers\nvalue-unit: Committed kilos per variety\nhappening: no\nchannel: ch-app\nkind: money",
  },
);

export const LearningEngineSchema = block(
  {
    id: id(),
    entity: ref("entity", "The entity-role whose evolution this row designs", true),
    entry: list("Entry points: how the entity arrives on the platform"),
    onboarding: list("Key challenges when onboarding (consumers 'check the menu', producers 'write the menu')"),
    "getting-better": list("Key challenges when getting better (bundles, advanced offers, badges)"),
    "new-opportunity": list("Key challenges when catching the new opportunity (radical evolution)"),
    "evolves-to": refs("entity", "Roles this one can evolve into: consumer → producer, producer → partner"),
  },
  {
    description: "One row of the Learning Engine: the challenges an entity-role meets on its way to thriving.",
    step: "D6",
    tips: [
      "Focus on one or few key challenges per stage, and one or few services per challenge.",
      "A path from the consumption side to the production side is an internal growth engine.",
    ],
    example: "id: le-farmers\nentity: e-farmers\nonboarding:\n  - Publishing a first harvest forecast\ngetting-better:\n  - Planning crops against demand\nevolves-to: e-coop",
  },
);

export const ServiceSchema = block(
  {
    id: id(),
    title: title(),
    for: refs("entity", "The entity-roles the platform offers it to"),
    stage: oneOf(LEARNING_STAGES, "The learning-engine stage it serves"),
    kind: oneOf(
      ["enabling", "empowering", "other"],
      "Enabling (to partners), empowering (to peer producers) or other (to peer consumers), as on the Platform Design Canvas",
    ),
    supports: refs("transaction", "Transactions it makes easier"),
    channel: ref("channel", "Where it is delivered"),
  },
  {
    description: "A service the platform provides to entities (platform-to-entity), in the learning engine or around transactions.",
    step: "D6",
    tips: [
      "Services answer the challenges of a learning-engine stage — link them with `stage`.",
      "Consider offering learning for free when the platform charges per transaction: it is a strong attraction point.",
    ],
    example: "id: s-storefront\ntitle: Storefront in a day\nfor: e-farmers\nstage: onboarding\nkind: empowering\nchannel: ch-app",
  },
);

export const ExperienceSchema = block(
  {
    id: id(),
    title: title(),
    "core-entity": ref("entity", "A — the core role whose point of view the experience takes", true),
    roles: refs("entity", "B–E — the other roles involved"),
    relationship: ref("relationship", "The relationship the experience is designed around"),
    "value-proposition": text("The value proposition for the core role, resonating with its portrait"),
    steps: refs(["transaction", "service"], "The experience flow, in order: transactions (entity↔entity) and services (platform→entity)"),
    activities: list("Business model: platform activities"),
    resources: list("Business model: platform resources and components"),
    costs: list("Business model: value provided and cost"),
    revenues: list("Business model: value captured and revenues"),
  },
  {
    description: "A platform experience: an interactive journey assembled from transactions and services, with its business model.",
    step: "D7",
    tips: [
      "Name it and pick one point of view in one relationship; keep the relationship's Transactions Board at hand.",
      "Focus on onboarding and getting better — the transformative step usually belongs to another experience.",
      "Explore the business model last, when the full flow of value is visible.",
    ],
    example:
      "id: x-box\ntitle: The weekly harvest box\ncore-entity: e-households\nroles: e-farmers\nrelationship: r-farmer-household\nsteps: s-onboard, t-subscribe, t-deliver\nrevenues:\n  - 8 % commission per box",
  },
);

export const MvpSchema = block(
  {
    id: id(),
    title: title(),
    experiences: refs("experience", "The platform experiences that form this MVP", true),
    base: list("MVP base: what you already have — contacts, assets, channels"),
    implementation: text("How the experiences are implemented for now: concierge, Wizard of Oz …"),
    status: oneOf(["planned", "running", "done"], "Where the MVP stands"),
  },
  {
    description: "The Minimum Viable Platform: the leanest setup that tests an experience's riskiest assumptions with the real ecosystem.",
    step: "D8",
    tips: ["Always start from what you have.", "A platform MVP is interactive: its value grows with network effects, so test the pull, not just the product."],
    example: "id: mvp-pilot\ntitle: Twelve-week pilot\nexperiences: x-box\nimplementation: Concierge — orders by spreadsheet\nstatus: running",
  },
);

export const AssumptionSchema = block(
  {
    id: id(),
    title: title(),
    mvp: ref("mvp", "The MVP that tests it", true),
    kind: oneOf(["business-model", "trust", "attraction", "other"], "Which class of assumption", true),
    riskiest: flag("Among the core and riskiest assumptions"),
    test: text("How the MVP is going to test it"),
    criteria: text("The unbiased criterion for validation, e.g. a measurable conversion rate"),
    status: oneOf(["open", "validated", "invalidated"], "What the test has shown so far"),
  },
  {
    description: "A key assumption of an experience and how the MVP tests it: one row of the MVP Canvas.",
    step: "D8",
    tips: [
      "List all assumptions with the team first; only then pick the riskiest.",
      "Test business model, trust and attraction as early as possible.",
      "Prefer unbiased criteria such as conversion rates over opinions.",
    ],
    example:
      "id: a-renew\ntitle: Households renew after a season\nmvp: mvp-pilot\nkind: attraction\nriskiest: yes\ntest: Offer renewal in week 10\ncriteria: 70 % renew",
  },
);

// ---------------------------------------------------------------------------
// Growth
// ---------------------------------------------------------------------------

export const ValuePropositionSchema = block(
  {
    id: id(),
    title: title(),
    kind: oneOf(["product", "marketplace", "extension"], "Product/service bundle, marketplace, or extension platform", true),
    customer: ref("entity", "The core customer of the product bundle"),
    relationship: ref("relationship", "For a marketplace: who meets whom"),
    mechanism: text("For an extension platform: how third parties extend the bundle (apps, plugins, UGC …)"),
    bundle: list("What the bundle contains"),
  },
  {
    description: "One element of the Platform Strategy Model: product bundle, marketplace or extension platform.",
    step: "G1",
    tips: [
      "Model the strategy you have, not an aspirational one — leave out elements that are not present.",
      "A product side for suppliers often solves the chicken-and-egg problem: come for the tool, stay for the network.",
    ],
    example: "id: vp-farm-tools\ntitle: Farm back-office\nkind: product\ncustomer: e-farmers\nbundle:\n  - Harvest forecasts\n  - Invoicing",
  },
);

export const NetworkSchema = block(
  {
    id: id(),
    relationship: ref("relationship", "The supply–demand relationship characterised", true),
    supply: oneOf(["commoditized", "differentiated"], "How demand perceives the supply side"),
    symmetry: oneOf(["symmetric", "asymmetric"], "Can one supplier serve many customers?"),
    location: oneOf(["local", "regional", "global"], "How bound the relationship is to a place"),
    tenancy: oneOf(["single", "multi"], "Do participants juggle several platforms?"),
    frequency: oneOf(["low", "medium", "high"], "Transaction frequency over the lifetime"),
    value: oneOf(["low", "medium", "high"], "Transaction value (average order value)"),
    exclusivity: oneOf(["monogamous", "polygamous"], "Long, exclusive relationships or plug-and-play ones"),
    curve: text("The expected shape of the network-effect curve and why"),
    tactics: someOf(TACTICS, "Growth tactics that fit these properties"),
  },
  {
    description: "The seven properties of the relationship underlying the network, and the tactics they suggest.",
    step: "G2",
    tips: [
      "Assess the properties first, then sketch the curve, then pick tactics.",
      "The properties belong to the relationship, not to the platform — 'we are like Airbnb' rarely holds.",
      "Commoditised, local, polygamous supply tends to plateau (asymptotic network effects).",
    ],
    example: "id: n-kitchen\nrelationship: r-farmer-kitchen\nsupply: differentiated\nlocation: regional\nfrequency: high\ntactics: single-user-value, community-content",
  },
);

export const FlywheelSchema = block(
  {
    id: id(),
    title: title(),
    type: oneOf(FLYWHEEL_TYPES, "Core network effect (direct/indirect) or a reinforcing flywheel", true),
    reinforces: ref("flywheel", "The flywheel this one compounds on"),
    loop: list("The nodes of the loop, in order"),
    bottleneck: text("The node that limits the loop — where to invest"),
    metric: text("The metric that captures the loop's state"),
  },
  {
    description: "A self-reinforcing loop of value creation: a core network effect or a defensibility flywheel on top of it.",
    step: "G3",
    tips: ["Always start from one core network-effect flywheel.", "Two to four flywheels, not ten — and find the bottleneck."],
    example: "id: fw-core\ntitle: More farms, better boxes\ntype: indirect-network\nloop:\n  - More farms\n  - More choice\n  - More households",
  },
);

export const LiquiditySchema = block(
  {
    id: id(),
    relationship: ref("relationship", "The relationship to bring to liquidity", true),
    "canonical-unit": text("Where liquidity is kick-started: category × location"),
    alternatives: list("What customers do today instead (their best alternative)"),
    "supply-threshold": text("Minimum order flow that makes the platform worth a supplier's time"),
    "demand-threshold": text("Minimum inventory depth for a credible conversion rate"),
    "start-with": oneOf(["supply", "demand"], "The side to focus on first"),
    constraints: list("How the launch is constrained (geography, category …)"),
  },
  {
    description: "The liquidity strategy for a relationship: thresholds, canonical unit and the side to start with.",
    step: "G4",
    tips: [
      "Nine times out of ten, start with supply — unless you already own demand or supply is a commodity.",
      "Benchmarks help: OpenTable needed about 25 restaurants per city, Airbnb about 300 homes.",
    ],
    example: "id: lq-kitchen\nrelationship: r-farmer-kitchen\ncanonical-unit: Chef-owned restaurants in the city centre\nstart-with: supply",
  },
);

export const GrowthLoopSchema = block(
  {
    id: id(),
    title: title(),
    type: oneOf(LOOP_TYPES, "Viral, paid, content, user-generated content or sales loop", true),
    equation: text("How this period's activity produces next period's new users"),
    bottleneck: text("The step with the lowest conversion"),
    "cycle-time": text("How long one turn of the loop takes"),
    metric: text("The metric the loop is steered by"),
  },
  {
    description: "A growth loop of the growth model: output of the system fed back as input.",
    step: "G5",
    tips: ["Write the loop as an equation — it is what the growth model spreadsheet will compute."],
    example: "id: gl-recipes\ntitle: Recipes bring neighbours\ntype: ugc\nequation: new households = shared recipes × click-through × conversion",
  },
);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BLOCK_SCHEMAS = {
  ecosystem: EcosystemSchema,
  arena: ArenaSchema,
  job: JobSchema,
  entity: EntitySchema,
  asset: AssetSchema,
  moat: MoatSchema,
  component: ComponentSchema,
  play: PlaySchema,
  scenario: ScenarioSchema,
  brief: BriefSchema,
  platform: PlatformSchema,
  motivation: MotivationSchema,
  relationship: RelationshipSchema,
  channel: ChannelSchema,
  transaction: TransactionSchema,
  "learning-engine": LearningEngineSchema,
  service: ServiceSchema,
  experience: ExperienceSchema,
  mvp: MvpSchema,
  assumption: AssumptionSchema,
  "value-proposition": ValuePropositionSchema,
  network: NetworkSchema,
  flywheel: FlywheelSchema,
  liquidity: LiquiditySchema,
  "growth-loop": GrowthLoopSchema,
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;
export type BlockData<K extends BlockType> = z.output<(typeof BLOCK_SCHEMAS)[K]>;

export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];

export function isBlockType(value: string): value is BlockType {
  return Object.hasOwn(BLOCK_SCHEMAS, value);
}

export function blockMeta(type: BlockType): BlockMeta {
  return (z.globalRegistry.get(BLOCK_SCHEMAS[type]) as { pdtBlock: BlockMeta }).pdtBlock;
}

export interface FieldInfo extends FieldMeta {
  name: string;
}

export function blockFields(type: BlockType): FieldInfo[] {
  return Object.entries(BLOCK_SCHEMAS[type].shape).map(([name, schema]) => ({
    name,
    ...(z.globalRegistry.get(schema as z.ZodType) as { pdt: FieldMeta }).pdt,
  }));
}

/** All reference fields of all block types: the edges of the meta-model. */
export function crossReferences(): { from: BlockType; field: string; to: string[]; many: boolean; required: boolean }[] {
  return BLOCK_TYPES.flatMap((type) =>
    blockFields(type)
      .filter((f) => f.kind === "ref" || f.kind === "refs")
      .map((f) => ({ from: type, field: f.name, to: f.target ?? [], many: f.kind === "refs", required: f.required })),
  );
}
