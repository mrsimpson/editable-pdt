// The PDT meta-model: every block type, its attributes and the canvas it feeds.
//
// Attribute kinds:
//   text      single line of text
//   list      several short statements (one sticky note each)
//   enum      one of `values`
//   ref       id of one element of type `to`
//   refs      ids of several elements of type `to` (order matters)
//   number    integer

export const ROLES = [
  { id: "shaper", label: "Platform Shapers", short: "Shaper" },
  { id: "peer-producer", label: "Peer Producers", short: "Peer Producer" },
  { id: "peer-consumer", label: "Peer Consumers", short: "Peer Consumer" },
  { id: "partner", label: "Partners", short: "Partner" },
  { id: "stakeholder", label: "Impact Stakeholders", short: "Stakeholder" },
];

export const BLOCK_TYPES = {
  platform: {
    label: "Platform",
    chapter: 1,
    summary: "The platform strategy in one place: its name, purpose and who shapes it.",
    singleton: true,
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      purpose: { kind: "text", help: "Why the platform exists, in one sentence." },
      shapers: { kind: "refs", to: "entity", help: "Entities that shape and govern the platform." },
      "core-value": { kind: "text", help: "The core value unit the ecosystem exchanges." },
    },
  },
  entity: {
    label: "Entity",
    chapter: 2,
    summary:
      "A role in the ecosystem, with its portrait: context, pressures, gains, the experience it seeks and the resources it brings.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      role: { kind: "enum", values: ROLES.map((r) => r.id), required: true },
      context: { kind: "list", help: "Who they are and where they operate." },
      pressures: { kind: "list", help: "Performance pressures and trends acting on them." },
      gains: { kind: "list", help: "What they expect to gain from the ecosystem." },
      seeks: { kind: "list", help: "The experience they are looking for." },
      resources: { kind: "list", help: "Resources and capabilities they can bring and share." },
    },
  },
  motivation: {
    label: "Motivation",
    chapter: 3,
    summary: "What one entity brings to another — one cell of the ecosystem motivations matrix.",
    attributes: {
      id: { kind: "text", required: true },
      from: { kind: "ref", to: "entity", required: true },
      to: { kind: "ref", to: "entity", required: true },
      gives: { kind: "text", required: true, help: "The value `from` offers `to`." },
    },
  },
  channel: {
    label: "Channel",
    chapter: 4,
    summary: "A place where transactions happen: an app, a market square, a hotline.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      medium: { kind: "enum", values: ["digital", "physical", "hybrid"] },
    },
  },
  transaction: {
    label: "Transaction",
    chapter: 4,
    summary: "An exchange of information, goods, money or attention between two entities.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      from: { kind: "ref", to: "entity", required: true },
      to: { kind: "ref", to: "entity", required: true },
      flow: { kind: "enum", values: ["information", "value", "money", "reputation"], required: true },
      status: { kind: "enum", values: ["existing", "potential"] },
      channel: { kind: "ref", to: "channel" },
    },
  },
  service: {
    label: "Service",
    chapter: 5,
    summary:
      "Something the platform offers. Enabling services make transactions easier; empowering services help entities grow.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      kind: { kind: "enum", values: ["enabling", "empowering"], required: true },
      for: { kind: "refs", to: "entity", help: "The entities that use the service." },
      supports: { kind: "refs", to: "transaction", help: "Transactions the service makes easier." },
      channel: { kind: "ref", to: "channel" },
    },
  },
  "learning-engine": {
    label: "Learning Engine",
    chapter: 5,
    summary:
      "The path along which the platform helps one entity evolve, from where it stands today to where it wants to be.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      entity: { kind: "ref", to: "entity", required: true },
      current: { kind: "text", help: "Where the entity stands today." },
      desired: { kind: "text", help: "Where the entity wants to be." },
      steps: { kind: "refs", to: "service", help: "Empowering services in the order they are met." },
    },
  },
  experience: {
    label: "Experience",
    chapter: 6,
    summary:
      "A platform experience: the transactions and services that together deliver the core value to the entities involved.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      entities: { kind: "refs", to: "entity", required: true },
      transactions: { kind: "refs", to: "transaction" },
      services: { kind: "refs", to: "service" },
      "core-value": { kind: "text", help: "The unit of value this experience produces." },
      meaning: { kind: "text", help: "Why the experience matters to the people in it." },
    },
  },
  mvp: {
    label: "MVP",
    chapter: 7,
    summary: "The smallest test that tells whether an experience works, with its hypotheses and metrics.",
    attributes: {
      id: { kind: "text", required: true },
      title: { kind: "text", required: true },
      experience: { kind: "ref", to: "experience", required: true },
      status: { kind: "enum", values: ["planned", "running", "validated", "invalidated"] },
      hypotheses: { kind: "list", help: "What must be true for the experience to work." },
      experiments: { kind: "list", help: "What you will do to find out." },
      metrics: { kind: "list", help: "What you will measure." },
      criteria: { kind: "list", help: "The results that count as success." },
    },
  },
};

export const CHAPTERS = [
  { number: 1, slug: "platform", title: "Platform" },
  { number: 2, slug: "ecosystem", title: "Ecosystem" },
  { number: 3, slug: "motivations", title: "Motivations" },
  { number: 4, slug: "transactions", title: "Transactions" },
  { number: 5, slug: "learning-engine", title: "Learning Engine" },
  { number: 6, slug: "experiences", title: "Experiences" },
  { number: 7, slug: "mvp", title: "MVP" },
];

export const CANVASES = [
  {
    id: "ecosystem",
    title: "Ecosystem Canvas",
    short: "Ecosystem",
    question: "Who is part of the ecosystem, and what role do they play?",
    types: ["platform", "entity"],
  },
  {
    id: "portraits",
    title: "Entity Portraits",
    short: "Portraits",
    question: "What drives each entity, and what does it bring?",
    types: ["entity"],
  },
  {
    id: "motivations",
    title: "Motivations Matrix",
    short: "Motivations",
    question: "What does each entity offer each other?",
    types: ["entity", "motivation"],
  },
  {
    id: "transactions",
    title: "Transactions Board",
    short: "Transactions",
    question: "What flows between entities today, and what could flow tomorrow?",
    types: ["entity", "transaction", "channel"],
  },
  {
    id: "learning",
    title: "Learning Engine",
    short: "Learning",
    question: "How does the platform help entities grow?",
    types: ["learning-engine", "service"],
  },
  {
    id: "experiences",
    title: "Platform Experience",
    short: "Experience",
    question: "Which transactions and services add up to an experience worth having?",
    types: ["experience", "service", "transaction"],
  },
  {
    id: "mvp",
    title: "MVP Canvas",
    short: "MVP",
    question: "What is the smallest test that tells whether an experience works?",
    types: ["mvp"],
  },
];

export function roleOf(id) {
  return ROLES.find((r) => r.id === id);
}
