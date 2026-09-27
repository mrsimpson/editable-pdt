// The Platform Design Toolkit methodology as data: phases, steps, roles, canvases and the
// vocabularies behind enum values. Written in our own words; every step and canvas links to the
// original PDT material (© Boundaryless SRL, CC BY-SA 4.0), which remains authoritative.

import type { BlockType, Phase } from "./schemas.ts";

const DOCS = "https://docs.boundaryless.io/methodology";

export interface PhaseInfo {
  id: Phase;
  title: string;
  question: string;
  guide: string;
  folder: string;
}

export const PHASES: PhaseInfo[] = [
  {
    id: "exploration",
    title: "Exploration",
    question: "Is there a platform opportunity — and where exactly?",
    guide: `${DOCS}/legacy/pdt/exploration`,
    folder: "1-exploration",
  },
  {
    id: "design",
    title: "Strategy Design",
    question: "How do we design the platform for this ecosystem?",
    guide: `${DOCS}/legacy/pdt/design`,
    folder: "2-design",
  },
  {
    id: "growth",
    title: "Growth",
    question: "How do we launch it and make it grow?",
    guide: `${DOCS}/legacy/pdt/growth`,
    folder: "3-growth",
  },
];

export interface StepInfo {
  id: string;
  phase: Phase;
  title: string;
  question: string;
  /** The canvases the step works with. */
  canvases: string[];
  /** The canvas its chapter must show (rule W011), if the step has one. */
  canvas?: string;
  /** Block types this step creates. */
  blocks: BlockType[];
  /** Block types this step fills in further (e.g. portraits on entities). */
  enriches?: { type: BlockType; fields: string[] }[];
  how: string[];
  outcome: string;
  source: string;
  /** Workspace-relative default file for this step's blocks. */
  file: string;
}

const file = (phase: string, name: string) => `${phase}/${name}.pdt42.md`;

export const STEPS: StepInfo[] = [
  // ── Exploration ──────────────────────────────────────────────────────────
  {
    id: "E1",
    phase: "exploration",
    title: "Identify the ecosystem and its arenas",
    question:
      "What does the ecosystem look like, and which arenas of systemic outcomes make it up?",
    canvases: ["arena-scan"],
    canvas: "arena-scan",
    blocks: ["ecosystem", "arena"],
    how: [
      "Describe the ecosystem in prose: who creates and exchanges value today, in which phases or layers.",
      "List the arenas: phases with a before/after (`after:`) or layers where one arena enables another (`enables:`).",
      "Mark the arenas you can act on with `focus: yes` — your perspective of enablement, not a ranking of importance.",
      "Break each focus arena into the steps of its systemic interaction; the universal job map helps.",
    ],
    outcome: "A first landscape of arenas, with the focus arenas broken into steps to scan.",
    source: `${DOCS}/canvases/arena-scan-canvas`,
    file: file("1-exploration", "e1-arenas"),
  },
  {
    id: "E2",
    phase: "exploration",
    title: "Scan the ecosystem",
    question: "Which experiences already happen, among which entities, on which market layer?",
    canvases: ["ecosystem-scan"],
    canvas: "ecosystem-scan",
    blocks: ["job"],
    enriches: [{ type: "entity", fields: ["layer"] }],
    how: [
      "Enumerate the most frequent or valuable experiences (steps) as `job` blocks, each in its arena.",
      "Add the entities that take part and place each on a layer: long tail (niche producers and consumers), aggregator (brokers, trusted advisors) or infrastructure (commodities, building blocks).",
      "Validate the picture with real entities or a domain expert before trusting it.",
    ],
    outcome:
      "The contexts of interaction, the entities involved and how they lay out across the market layers.",
    source: `${DOCS}/canvases/ecosystem-scan-canvas`,
    file: file("1-exploration", "e2-scan"),
  },
  {
    id: "E3",
    phase: "exploration",
    title: "Identify leverageable assets and moats",
    question:
      "Where can you build on your strengths, and who holds positions that are hard to displace?",
    canvases: ["vrio", "ecosystem-scan"],
    canvas: "vrio",
    blocks: ["asset", "moat"],
    how: [
      "List your assets and capabilities; test each in order: valuable, rare, inimitable, organised.",
      "Record the moats: established demand or supply aggregators and regulated or permissioned players.",
      "Position both next to the entities or experiences they relate to.",
    ],
    outcome:
      "Awareness of your strengths and of the incumbents — the evidence for choosing an arena.",
    source: `${DOCS}/canvases/vrio-analysis-canvas`,
    file: file("1-exploration", "e3-assets-moats"),
  },
  {
    id: "E4",
    phase: "exploration",
    title: "Choose the arena to focus on",
    question: "Which arena gives the best starting point for a platform strategy?",
    canvases: ["arena-scan"],
    blocks: [],
    enriches: [{ type: "arena", fields: ["focus"] }],
    how: [
      "Weigh the focus arenas on four things: leverageable assets, absence of moats (especially at the aggregator layer), strategic interest and addressable market.",
      "Explain the choice in prose next to the arena; keep one arena with `focus: yes` for the next steps.",
    ],
    outcome: "The arena where you will analyse the value chain.",
    source: `${DOCS}/legacy/pdt/exploration`,
    file: file("1-exploration", "e1-arenas"),
  },
  {
    id: "E5",
    phase: "exploration",
    title: "Map the value chain",
    question: "How does value flow today, from the user need down to commodities?",
    canvases: ["wardley-map"],
    canvas: "wardley-map",
    blocks: ["component"],
    how: [
      "Start at the top with the user need; place every component by visibility first, then by evolution.",
      "Unbundle into atomic components and link dependencies with `needs:`.",
      "Expect a C-shaped chain in an industrial, pipeline arena.",
    ],
    outcome: "The as-is value chain of the arena.",
    source: `${DOCS}/canvases/wardley-map-canvas`,
    file: file("1-exploration", "e5-value-chain"),
  },
  {
    id: "E6",
    phase: "exploration",
    title: "Apply the six Platform Plays",
    question: "How could a platform transform this value chain?",
    canvases: ["platform-plays", "wardley-map"],
    canvas: "platform-plays",
    blocks: ["play"],
    enriches: [{ type: "component", fields: ["target"] }],
    how: [
      "Walk the plays one at a time with their guiding questions; record only those with real impact.",
      "Move the affected components (`target:` evolution) and note what each play reveals.",
      "Collect the transactions to standardise and the traits of the product side.",
    ],
    outcome: "A to-be, Z-shaped value chain and the insights that feed the transactions engine.",
    source: `${DOCS}/canvases/platform-plays`,
    file: file("1-exploration", "e6-plays"),
  },
  {
    id: "E7",
    phase: "exploration",
    title: "Identify the platformization space and consolidate the brief",
    question: "Which focused space, around which core relationship, do you design for?",
    canvases: ["brief-consolidation", "pattern-cards"],
    canvas: "brief-consolidation",
    blocks: ["scenario", "brief"],
    how: [
      "Play the Pattern Cards whose signals are visible and write the resulting WHAT-IF scenarios.",
      "If the chain splits into sub-chains, pick one platformization space.",
      "Write the brief: the arena, the entities that seed the Ecosystem Canvas, transactions to standardise, product-side traits.",
    ],
    outcome: "A strategic brief — the bridge into strategy design.",
    source: `${DOCS}/canvases/brief-consolidation-canvas`,
    file: file("1-exploration", "e7-brief"),
  },
  // ── Design ───────────────────────────────────────────────────────────────
  {
    id: "D1",
    phase: "design",
    title: "Map the ecosystem",
    question: "Who is in the ecosystem, clustered into which roles?",
    canvases: ["ecosystem"],
    canvas: "ecosystem",
    blocks: ["platform", "entity"],
    enriches: [{ type: "entity", fields: ["role", "clusters"] }],
    how: [
      "Brainstorm entities alone first, then together; cluster similar ones into entity-roles (`clusters:`).",
      "Give each a `role`: owner, stakeholder, peer-consumer, peer-producer or partner — by the key value it produces or consumes.",
      "Keep at most five roles in the peer spectrum.",
      "Add the `platform` block with its owners.",
    ],
    outcome: "The entity-roles already trying to exchange value in the ecosystem.",
    source: `${DOCS}/canvases/ecosystem-canvas-pdt`,
    file: file("2-design", "d1-ecosystem"),
  },
  {
    id: "D2",
    phase: "design",
    title: "Portray the entity-roles",
    question: "What is each role's context, what drives it, and what gains does it seek?",
    canvases: ["entity-portrait"],
    canvas: "entity-portrait",
    blocks: [],
    enriches: [
      {
        type: "entity",
        fields: [
          "context",
          "assets",
          "capabilities",
          "potential",
          "goals",
          "pressures",
          "convenience-gains",
          "reach-gains",
          "value-gains",
        ],
      },
    ],
    how: [
      "Start with the role most interesting for your design challenge.",
      "Fill potential first (assets, capabilities, potential), then the compressors (goals, pressures), then the three kinds of gains.",
      "Map what they look for in their current experience — outside-in, not your platform idea.",
      "Informal interviews with representatives beat assumptions.",
    ],
    outcome:
      "You have worn their clothes — and have a raw idea of your multi-sided value propositions.",
    source: `${DOCS}/canvases/entity-portrait-canvas`,
    file: file("2-design", "d1-ecosystem"),
  },
  {
    id: "D3",
    phase: "design",
    title: "Analyse the motivations to exchange value",
    question: "What can each role give to each other role — today and potentially?",
    canvases: ["motivations-matrix"],
    canvas: "motivations-matrix",
    blocks: ["motivation"],
    how: [
      "Put the roles in the same order on rows and columns; each cell is what the row gives to the column.",
      "Fill cells between different role types first, then the diagonal.",
      "Mark `status: current` or `potential`; always look for money, reputation and feedback.",
    ],
    outcome: "The potential to exchange value in the system — and the strongest relationships.",
    source: `${DOCS}/canvases/motivations-matrix-canvas`,
    file: file("2-design", "d3-motivations"),
  },
  {
    id: "D4",
    phase: "design",
    title: "Choose the core relationships",
    question: "Which one to three relationships, and which core entity, do you design for first?",
    canvases: [],
    blocks: ["relationship"],
    enriches: [{ type: "platform", fields: ["core-entity"] }],
    how: [
      "Read the matrix for the relationships where most value flows; a triangle often works well.",
      "Write each as a `relationship` with `core: yes`, and set `core-entity` on the platform.",
      "Make sure every entity in the core system has a portrait.",
    ],
    outcome: "The core system you design this iteration's experiences around.",
    source: `${DOCS}/legacy/pdt/design`,
    file: file("2-design", "d4-relationships"),
  },
  {
    id: "D5",
    phase: "design",
    title: "Identify the elementary transactions and channels",
    question:
      "Which atomic transactions happen — or could — in each core relationship, through which channels?",
    canvases: ["transactions-board"],
    canvas: "transactions-board",
    blocks: ["transaction", "channel"],
    how: [
      "One Transactions Board per core relationship: every transaction references it.",
      "Enumerate atomic, verb-shaped transactions from the motivations; mark `happening: yes` where they already occur.",
      "Be specific about the `value-unit`.",
      "For each channel, list its components and how it lowers the transaction cost.",
    ],
    outcome: "A simple model of atomic transactions and the channels you need to build.",
    source: `${DOCS}/canvases/transactions-board-canvas`,
    file: file("2-design", "d5-transactions"),
  },
  {
    id: "D6",
    phase: "design",
    title: "Design the learning engine",
    question:
      "How does the platform help each role onboard, get better and catch new opportunities?",
    canvases: ["learning-engine"],
    canvas: "learning-engine",
    blocks: ["learning-engine", "service"],
    how: [
      "One `learning-engine` per role: entry points, then the key challenges of each stage.",
      "Design one or few `service`s per challenge and link them with `stage`.",
      "Look for evolution paths between roles (`evolves-to`).",
    ],
    outcome:
      "The services through which entities improve continuously — the platform-to-entity bricks.",
    source: `${DOCS}/canvases/learning-engine-canvas`,
    file: file("2-design", "d6-learning-engine"),
  },
  {
    id: "D7",
    phase: "design",
    title: "Assemble the platform experiences",
    question:
      "Which journey, from the core role's point of view, delivers the value proposition — and sustains itself?",
    canvases: ["platform-experience"],
    canvas: "platform-experience",
    blocks: ["experience"],
    how: [
      "Name the experience and choose the core role in one relationship.",
      "Order the steps from transactions (entity↔entity) and services (platform→entity).",
      "Write a value proposition that resonates with the core role's portrait.",
      "Only then the business model: activities, resources, costs, revenues.",
    ],
    outcome: "A tangible answer to 'what is your platform?'.",
    source: `${DOCS}/canvases/platform-experience-canvas`,
    file: file("2-design", "d7-experiences"),
  },
  {
    id: "D8",
    phase: "design",
    title: "Set up the Minimum Viable Platform",
    question: "What is the leanest test of the riskiest assumptions with the real ecosystem?",
    canvases: ["mvp"],
    canvas: "mvp",
    blocks: ["mvp", "assumption"],
    how: [
      "Choose the experiences the MVP features and list what you already have (`base`).",
      "List all assumptions first, then mark the riskiest; cover business model, trust and attraction.",
      "For each: how the MVP tests it and an unbiased validation criterion.",
    ],
    outcome: "An MVP you can run to learn whether the riskiest assumptions hold.",
    source: `${DOCS}/canvases/mvp-canvas`,
    file: file("2-design", "d8-mvp"),
  },
  // ── Growth ───────────────────────────────────────────────────────────────
  {
    id: "G1",
    phase: "growth",
    title: "Frame the Platform Strategy Model",
    question: "Which product bundle, marketplaces and extension platform make up the strategy?",
    canvases: ["platform-strategy-model"],
    canvas: "platform-strategy-model",
    blocks: ["value-proposition"],
    how: [
      "Articulate the product/service bundle and its core customer.",
      "Add each marketplace as a relationship: who meets whom, exchanging what.",
      "Add an extension platform only if third parties really extend the bundle.",
    ],
    outcome: "The strategy as a synthetic three-element view.",
    source: `${DOCS}/canvases/platform-strategy-model-canvas`,
    file: file("3-growth", "g1-strategy-model"),
  },
  {
    id: "G2",
    phase: "growth",
    title: "Characterise the network",
    question: "How will network effects behave in this relationship?",
    canvases: ["network-properties"],
    canvas: "network-properties",
    blocks: ["network"],
    how: [
      "One `network` per core relationship: assess the seven properties first.",
      "Describe the expected network-effect curve — does it plateau?",
      "Pick the growth tactics that fit the properties.",
    ],
    outcome: "How network effects will behave, and the tactics to reach liquidity.",
    source: `${DOCS}/canvases/network-properties-canvas`,
    file: file("3-growth", "g2-network"),
  },
  {
    id: "G3",
    phase: "growth",
    title: "Sketch the flywheels",
    question: "How does value compound — and what makes it defensible?",
    canvases: ["flywheel-sketching"],
    canvas: "flywheel-sketching",
    blocks: ["flywheel"],
    how: [
      "Start from one core network-effect flywheel (direct or indirect).",
      "Add two or three reinforcing flywheels: scale, brand, technology, data, lock-in.",
      "Name the bottleneck of each loop.",
    ],
    outcome: "A schematic of the platform's growth cycles.",
    source: `${DOCS}/canvases/flywheel-sketching-canvas`,
    file: file("3-growth", "g3-flywheels"),
  },
  {
    id: "G4",
    phase: "growth",
    title: "Plan liquidity",
    question: "Where and how do you solve the chicken-and-egg problem?",
    canvases: ["liquidity"],
    canvas: "liquidity",
    blocks: ["liquidity"],
    how: [
      "Frame the alternatives customers have first.",
      "Set the thresholds per side and the canonical unit (category × location).",
      "Decide which side to start with — usually supply.",
    ],
    outcome: "Where to look for liquidity, without spreading effort thin.",
    source: `${DOCS}/canvases/liquidity-canvas`,
    file: file("3-growth", "g4-liquidity"),
  },
  {
    id: "G5",
    phase: "growth",
    title: "Build the growth engine",
    question: "Which loops sustain growth after liquidity?",
    canvases: ["growth-model"],
    canvas: "growth-model",
    blocks: ["growth-loop"],
    how: [
      "Write each active loop as an equation, with its bottleneck and cycle time.",
      "Steer each loop by one metric.",
    ],
    outcome: "The loops a growth model can quantify.",
    source: `${DOCS}/legacy/pdt/growth`,
    file: file("3-growth", "g5-growth-loops"),
  },
];

export function stepById(id: string): StepInfo | undefined {
  return STEPS.find((s) => s.id.toLowerCase() === id.toLowerCase());
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export interface RoleInfo {
  id: string;
  code: string;
  label: string;
  group: "impact" | "demand" | "supply";
  summary: string;
}

export const ROLES: RoleInfo[] = [
  {
    id: "owner",
    code: "PO",
    label: "Platform owner / shaper",
    group: "impact",
    summary:
      "Holds the vision and makes sure the strategy exists and evolves; can be a team, a firm, a cooperative or a consortium.",
  },
  {
    id: "stakeholder",
    code: "ES",
    label: "External stakeholder",
    group: "impact",
    summary:
      "Cares about the whole system — regulation, externalities, governance, distribution — rather than single interactions.",
  },
  {
    id: "peer-consumer",
    code: "PC",
    label: "Peer consumer",
    group: "demand",
    summary:
      "Consumes the value created on the platform; individuals or small organisations who can leave easily.",
  },
  {
    id: "peer-producer",
    code: "PP",
    label: "Peer producer",
    group: "supply",
    summary:
      "Produces value, often occasionally, and wants to become more professional; may also consume.",
  },
  {
    id: "partner",
    code: "PA",
    label: "Partner",
    group: "supply",
    summary:
      "A professional producer in a closer, more strategic relationship with the owner — often niche or premium, sometimes a broker.",
  },
];

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

export const PLAY_LABELS: Record<string, string> = {
  pp1: "Bring back personalisation of the experience for users",
  pp2: "Bring producers on top of the value chain",
  pp3: "Standardise transactions",
  pp4: "Embed complex business processes in software as a service",
  pp5: "Enable leveraging identity, reputation and trust",
  pp6: "Aggregate demand (and supply)",
};

export const PATTERN_LABELS: Record<string, string> = {
  e1: "Aggregating shared infrastructure (aggregator)",
  e2: "Unbundling assets (aggregator)",
  e3: "Generate network effects by connecting niches (long tail)",
  e4: "Create a new profession (aggregator)",
  e5: "Think boundaryless (infrastructure)",
  e6: "Stop focusing on customers (infrastructure)",
  e7: "Climb the value chain: higher-level ecosystems (long tail)",
  e8: "Let the best emerge (aggregator)",
  e9: "Aggregating shared infrastructure (infrastructure)",
  e10: "Unbundling assets (infrastructure)",
  e11: "Generate network effects by connecting niches (aggregator)",
  e12: "Transform competitors into providers (aggregator)",
};

export const TACTIC_LABELS: Record<string, string> = {
  trust: "Building trust",
  marquee: "Marquee strategy",
  "single-user-value": "Single-user value (SaaS)",
  virality: "Leverage virality",
  nesting: "Nest inside an existing platform",
  "hyper-targeting": "Hyper-targeted marketing / SEO",
  "remnant-inventory": "Leverage remnant inventory",
  scraping: "Scraping and automation",
  subsidize: "Subsidise one side",
  "community-content": "Community and e-mail lists through content",
};

export const FLYWHEEL_LABELS: Record<string, string> = {
  "direct-network": "Direct network effect",
  "indirect-network": "Indirect (cross-side) network effect",
  scale: "Economies of scale",
  brand: "Brand reinforcing",
  tech: "Proprietary technology",
  data: "Data capture and optimisation",
  "lock-in": "Lock-in / embedding",
};

// ---------------------------------------------------------------------------
// Canvases — each area names the model fields that fill it
// ---------------------------------------------------------------------------

export interface CanvasArea {
  title: string;
  /** `type` or `type.field`, optionally with a filter: `entity[role=partner]`. */
  fills: string[];
}

export interface CanvasInfo {
  id: string;
  title: string;
  phase: Phase;
  steps: string[];
  kind: "canvas" | "card deck" | "catalog";
  /** One canvas per …, if not one per workspace. */
  per?: BlockType;
  areas: CanvasArea[];
  source: string;
}

export const CANVASES: CanvasInfo[] = [
  {
    id: "arena-scan",
    title: "Arena Scan",
    phase: "exploration",
    steps: ["E1", "E4"],
    kind: "canvas",
    areas: [
      {
        title: "Arenas map (before → after, enabling → enabled)",
        fills: ["arena.after", "arena.enables"],
      },
      { title: "FOCUS area", fills: ["arena.focus"] },
      { title: "Steps of the focus arenas", fills: ["arena.steps"] },
    ],
    source: `${DOCS}/canvases/arena-scan-canvas`,
  },
  {
    id: "ecosystem-scan",
    title: "Ecosystem Scan",
    phase: "exploration",
    steps: ["E2", "E3"],
    kind: "canvas",
    areas: [
      { title: "Long tail markets", fills: ["entity[layer=long-tail]", "job"] },
      { title: "Aggregators / platforms", fills: ["entity[layer=aggregator]"] },
      { title: "Infrastructures", fills: ["entity[layer=infrastructure]"] },
      { title: "Assets and moats overlays", fills: ["asset", "moat"] },
    ],
    source: `${DOCS}/canvases/ecosystem-scan-canvas`,
  },
  {
    id: "vrio",
    title: "VRIO Analysis",
    phase: "exploration",
    steps: ["E3"],
    kind: "canvas",
    areas: [
      {
        title: "Assets and capabilities × Value, Rarity, Imitability, Organisation",
        fills: ["asset.vrio"],
      },
    ],
    source: `${DOCS}/canvases/vrio-analysis-canvas`,
  },
  {
    id: "wardley-map",
    title: "Wardley Map",
    phase: "exploration",
    steps: ["E5", "E6"],
    kind: "canvas",
    per: "arena",
    areas: [
      { title: "Users and user value (top)", fills: ["component[visibility≥90]"] },
      {
        title: "Visibility (Y) × evolution (X)",
        fills: ["component.visibility", "component.evolution", "component.needs"],
      },
      { title: "To-be positions after the plays", fills: ["component.target"] },
    ],
    source: `${DOCS}/canvases/wardley-map-canvas`,
  },
  {
    id: "platform-plays",
    title: "Platform Plays",
    phase: "exploration",
    steps: ["E6"],
    kind: "catalog",
    areas: [{ title: "PP1–PP6 applied to the value chain", fills: ["play"] }],
    source: `${DOCS}/canvases/platform-plays`,
  },
  {
    id: "pattern-cards",
    title: "Pattern Cards",
    phase: "exploration",
    steps: ["E7"],
    kind: "card deck",
    areas: [{ title: "E1–E12 played as WHAT-IF scenarios", fills: ["scenario"] }],
    source: `${DOCS}/canvases/pattern-cards`,
  },
  {
    id: "brief-consolidation",
    title: "Brief Consolidation",
    phase: "exploration",
    steps: ["E7"],
    kind: "canvas",
    areas: [
      {
        title: "Long tail / aggregation / infrastructures layers",
        fills: ["entity.layer", "asset", "moat"],
      },
      { title: "WHAT-IF scenarios", fills: ["scenario"] },
      { title: "Strategic brief synthesis", fills: ["brief"] },
    ],
    source: `${DOCS}/canvases/brief-consolidation-canvas`,
  },
  {
    id: "ecosystem",
    title: "Ecosystem Canvas",
    phase: "design",
    steps: ["D1"],
    kind: "canvas",
    areas: [
      { title: "Ecosystem name", fills: ["ecosystem.title", "platform.title"] },
      { title: "Platform owners", fills: ["entity[role=owner]", "platform.owners"] },
      { title: "Partners", fills: ["entity[role=partner]"] },
      { title: "Peer producers", fills: ["entity[role=peer-producer]"] },
      { title: "Peer consumers", fills: ["entity[role=peer-consumer]"] },
      { title: "External stakeholders", fills: ["entity[role=stakeholder]"] },
    ],
    source: `${DOCS}/canvases/ecosystem-canvas-pdt`,
  },
  {
    id: "entity-portrait",
    title: "Entity-Role Portrait",
    phase: "design",
    steps: ["D2"],
    kind: "canvas",
    per: "entity",
    areas: [
      { title: "Role and type", fills: ["entity.role", "entity.type", "entity.clusters"] },
      {
        title: "Potential: assets and capabilities",
        fills: ["entity.assets", "entity.capabilities", "entity.potential"],
      },
      { title: "Performance pressures", fills: ["entity.pressures"] },
      { title: "Current goals", fills: ["entity.goals"] },
      { title: "Convenience gains", fills: ["entity.convenience-gains"] },
      { title: "Access & reach gains", fills: ["entity.reach-gains"] },
      { title: "Value gains", fills: ["entity.value-gains"] },
    ],
    source: `${DOCS}/canvases/entity-portrait-canvas`,
  },
  {
    id: "motivations-matrix",
    title: "Motivations Matrix",
    phase: "design",
    steps: ["D3"],
    kind: "canvas",
    areas: [
      { title: "Roles on rows and columns", fills: ["entity[role≠owner,stakeholder]"] },
      { title: "Gives-to cells", fills: ["motivation"] },
      {
        title: "Diagonal: exchanges between peers of the same type",
        fills: ["motivation[from=to]"],
      },
    ],
    source: `${DOCS}/canvases/motivations-matrix-canvas`,
  },
  {
    id: "transactions-board",
    title: "Transactions Board",
    phase: "design",
    steps: ["D5"],
    kind: "canvas",
    per: "relationship",
    areas: [
      { title: "Already happening in the ecosystem?", fills: ["transaction.happening"] },
      {
        title: "Role 1 · transaction · role 2",
        fills: ["transaction.from", "transaction.title", "transaction.direction", "transaction.to"],
      },
      { title: "Currency / value unit", fills: ["transaction.value-unit"] },
      { title: "Channel components", fills: ["channel.components"] },
      { title: "Notes on channel improvement", fills: ["channel.improvement"] },
    ],
    source: `${DOCS}/canvases/transactions-board-canvas`,
  },
  {
    id: "learning-engine",
    title: "Learning Engine",
    phase: "design",
    steps: ["D6"],
    kind: "canvas",
    areas: [
      { title: "Roles (rows)", fills: ["learning-engine.entity"] },
      { title: "Entry points", fills: ["learning-engine.entry"] },
      {
        title: "Onboarding: challenges / services",
        fills: ["learning-engine.onboarding", "service[stage=onboarding]"],
      },
      {
        title: "Getting better: challenges / services",
        fills: ["learning-engine.getting-better", "service[stage=getting-better]"],
      },
      {
        title: "Catching the new opportunity: challenges / services",
        fills: ["learning-engine.new-opportunity", "service[stage=new-opportunity]"],
      },
    ],
    source: `${DOCS}/canvases/learning-engine-canvas`,
  },
  {
    id: "platform-experience",
    title: "Platform Experience",
    phase: "design",
    steps: ["D7"],
    kind: "canvas",
    per: "experience",
    areas: [
      { title: "Experience name", fills: ["experience.title"] },
      {
        title: "Involved roles: A core, B–E others",
        fills: ["experience.core-entity", "experience.roles"],
      },
      {
        title: "Steps × channel / touchpoint lanes",
        fills: ["experience.steps", "transaction.channel", "service.channel"],
      },
      { title: "Value proposition for the core role", fills: ["experience.value-proposition"] },
      {
        title: "Platform activities · resources / components",
        fills: ["experience.activities", "experience.resources"],
      },
      {
        title: "Value provided / cost · value captured / revenues",
        fills: ["experience.costs", "experience.revenues"],
      },
    ],
    source: `${DOCS}/canvases/platform-experience-canvas`,
  },
  {
    id: "mvp",
    title: "Minimum Viable Platform",
    phase: "design",
    steps: ["D8"],
    kind: "canvas",
    per: "mvp",
    areas: [
      { title: "Platform experiences part of this MVP", fills: ["mvp.experiences"] },
      { title: "MVP base", fills: ["mvp.base"] },
      { title: "Notes on the current implementation", fills: ["mvp.implementation"] },
      { title: "Key assumptions → how the MVP tests them → criteria", fills: ["assumption"] },
    ],
    source: `${DOCS}/canvases/mvp-canvas`,
  },
  {
    id: "platform-design",
    title: "Platform Design Canvas",
    phase: "design",
    steps: ["D1", "D2", "D3", "D4", "D5", "D6"],
    kind: "canvas",
    areas: [
      {
        title: "Platform owners · stakeholders",
        fills: ["entity[role=owner]", "entity[role=stakeholder]"],
      },
      {
        title: "Enabling · empowering · other services",
        fills: ["service[kind=enabling]", "service[kind=empowering]", "service[kind=other]"],
      },
      {
        title: "Core and ancillary value propositions",
        fills: ["platform.core-value", "platform.ancillary-values"],
      },
      { title: "Infrastructures and core components", fills: ["platform.infrastructure"] },
      { title: "Transactions · channels and contexts", fills: ["transaction", "channel"] },
      {
        title: "Partners · peer producers · peer consumers",
        fills: ["entity[role=partner]", "entity[role=peer-producer]", "entity[role=peer-consumer]"],
      },
    ],
    source: `${DOCS}/canvases/platform-design-canvas`,
  },
  {
    id: "platform-strategy-model",
    title: "Platform Strategy Model",
    phase: "growth",
    steps: ["G1"],
    kind: "canvas",
    areas: [
      { title: "Product / service bundle", fills: ["value-proposition[kind=product]"] },
      { title: "Marketplace(s)", fills: ["value-proposition[kind=marketplace]"] },
      { title: "Extension platform", fills: ["value-proposition[kind=extension]"] },
    ],
    source: `${DOCS}/canvases/platform-strategy-model-canvas`,
  },
  {
    id: "network-properties",
    title: "Network Properties & NFX",
    phase: "growth",
    steps: ["G2"],
    kind: "canvas",
    per: "relationship",
    areas: [
      {
        title: "The seven properties",
        fills: [
          "network.supply",
          "network.symmetry",
          "network.location",
          "network.tenancy",
          "network.frequency",
          "network.value",
          "network.exclusivity",
        ],
      },
      { title: "Network-effects curve", fills: ["network.curve"] },
      { title: "Growth tactics", fills: ["network.tactics"] },
    ],
    source: `${DOCS}/canvases/network-properties-canvas`,
  },
  {
    id: "flywheel-sketching",
    title: "Flywheel Sketching",
    phase: "growth",
    steps: ["G3"],
    kind: "canvas",
    areas: [
      {
        title: "Core flywheel",
        fills: ["flywheel[type=direct-network]", "flywheel[type=indirect-network]"],
      },
      { title: "Reinforcing flywheels", fills: ["flywheel.reinforces"] },
    ],
    source: `${DOCS}/canvases/flywheel-sketching-canvas`,
  },
  {
    id: "liquidity",
    title: "Liquidity",
    phase: "growth",
    steps: ["G4"],
    kind: "canvas",
    per: "relationship",
    areas: [
      { title: "Value proposition and engagement check", fills: ["liquidity.alternatives"] },
      {
        title: "Thresholds per side",
        fills: ["liquidity.supply-threshold", "liquidity.demand-threshold"],
      },
      {
        title: "Constraining strategy and canonical unit",
        fills: ["liquidity.canonical-unit", "liquidity.constraints"],
      },
      { title: "Side focus", fills: ["liquidity.start-with"] },
    ],
    source: `${DOCS}/canvases/liquidity-canvas`,
  },
  {
    id: "growth-model",
    title: "Growth Model (draft)",
    phase: "growth",
    steps: ["G5"],
    kind: "canvas",
    areas: [{ title: "Active loops", fills: ["growth-loop"] }],
    source: `${DOCS}/canvases/growth-model-canvas`,
  },
];

export function canvasById(id: string): CanvasInfo | undefined {
  return CANVASES.find((c) => c.id === id);
}
