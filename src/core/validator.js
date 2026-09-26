import { BLOCK_TYPES } from "./schema.js";

// Each rule describes itself — `pdt rules` prints the registry — and checks
// the whole workspace. Errors mean the model is broken, warnings mean it
// contradicts itself, hints point at gaps in the design.

const refsOf = (element, key) => {
  const value = element.attributes[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};
const ofType = (ws, type) => ws.elements.filter((e) => e.type === type);
const at = (element) => ({ file: element.file, line: element.line, element: element.id });

export const RULES = [
  {
    code: "E001",
    severity: "error",
    title: "Duplicate id",
    rationale: "Every reference and every sticky on a canvas points to exactly one element. Two elements with one id make both ambiguous.",
    check(ws) {
      const seen = new Map();
      const out = [];
      for (const e of ws.elements) {
        if (!e.id) continue;
        if (seen.has(e.id)) out.push({ ...at(e), message: `Id "${e.id}" is already used in ${seen.get(e.id).file}:${seen.get(e.id).line}` });
        else seen.set(e.id, e);
      }
      return out;
    },
  },
  {
    code: "E002",
    severity: "error",
    title: "Unresolved reference",
    rationale: "A reference to an element that does not exist — or has the wrong type — draws an arrow to nowhere on the canvases.",
    check(ws) {
      const out = [];
      for (const e of ws.elements) {
        const schema = BLOCK_TYPES[e.type];
        if (!schema) continue;
        for (const [key, def] of Object.entries(schema.attributes)) {
          if (def.kind !== "ref" && def.kind !== "refs") continue;
          for (const id of refsOf(e, key)) {
            const target = ws.byId.get(id);
            if (!target) out.push({ ...at(e), message: `${key}: "${id}" does not exist` });
            else if (target.type !== def.to) out.push({ ...at(e), message: `${key}: "${id}" is a ${target.type}, expected a ${def.to}` });
          }
        }
      }
      return out;
    },
  },
  {
    code: "E003",
    severity: "error",
    title: "Missing required attribute",
    rationale: "Required attributes decide where an element appears on a canvas. Without them it cannot be drawn.",
    check(ws) {
      const out = [];
      for (const e of ws.elements) {
        const schema = BLOCK_TYPES[e.type];
        if (!schema) continue;
        for (const [key, def] of Object.entries(schema.attributes)) {
          const value = e.attributes[key];
          const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
          if (def.required && empty) out.push({ ...at(e), message: `:::${e.type} needs "${key}"` });
        }
      }
      return out;
    },
  },
  {
    code: "E004",
    severity: "error",
    title: "Invalid value",
    rationale: "Enumerated attributes select a zone, a colour or a line style. An unknown value has no place to go.",
    check(ws) {
      const out = [];
      for (const e of ws.elements) {
        const schema = BLOCK_TYPES[e.type];
        if (!schema) continue;
        for (const [key, def] of Object.entries(schema.attributes)) {
          const value = e.attributes[key];
          if (def.kind === "enum" && value !== undefined && value !== "" && !def.values.includes(value)) {
            out.push({ ...at(e), message: `${key}: "${value}" is not one of ${def.values.join(", ")}` });
          }
        }
      }
      return out;
    },
  },
  {
    code: "E005",
    severity: "error",
    title: "Unreadable block",
    rationale: "Unknown block types and malformed lines are silently lost otherwise. The parser keeps them so this rule can name them.",
    check(ws) {
      const out = ws.parseErrors.map((p) => ({ file: p.file, line: p.line, message: p.message }));
      for (const e of ws.elements) {
        if (!e.known) out.push({ ...at(e), message: `Unknown block type :::${e.type}. Known: ${Object.keys(BLOCK_TYPES).join(", ")}` });
        else if (!e.id) out.push({ ...at(e), message: `:::${e.type} has no id` });
      }
      return out;
    },
  },
  {
    code: "E006",
    severity: "error",
    title: "More than one platform",
    rationale: "A workspace describes one platform. Two platform blocks leave the centre of the ecosystem canvas undecided.",
    check(ws) {
      return ofType(ws, "platform").slice(1).map((e) => ({ ...at(e), message: "Only one :::platform block is allowed per workspace" }));
    },
  },
  {
    code: "W001",
    severity: "warning",
    title: "Entity without transactions",
    rationale: "An ecosystem is defined by what flows between its members. An entity that neither gives nor receives is either missing transactions or not part of the ecosystem.",
    check(ws) {
      const involved = new Set(ofType(ws, "transaction").flatMap((t) => [t.attributes.from, t.attributes.to]));
      return ofType(ws, "entity")
        .filter((e) => e.attributes.role !== "stakeholder" && !involved.has(e.id))
        .map((e) => ({ ...at(e), message: `${e.title} takes part in no transaction` }));
    },
  },
  {
    code: "W002",
    severity: "warning",
    title: "Transaction with itself",
    rationale: "A transaction exchanges something between two different entities. Internal activities belong in the entity portrait.",
    check(ws) {
      return ofType(ws, "transaction")
        .filter((t) => t.attributes.from && t.attributes.from === t.attributes.to)
        .map((t) => ({ ...at(t), message: `${t.title} goes from ${t.attributes.from} to itself` }));
    },
  },
  {
    code: "W003",
    severity: "warning",
    title: "Block without prose",
    rationale: "The canvases show what; the prose explains why. A block with no explanation cannot be discussed or challenged.",
    check(ws) {
      return ws.elements
        .filter((e) => e.known && e.type !== "motivation" && !e.prose.trim())
        .map((e) => ({ ...at(e), message: `${e.title || e.id} has no explanatory prose above its block` }));
    },
  },
  {
    code: "W004",
    severity: "warning",
    title: "Learning step is not empowering",
    rationale: "A learning engine describes how entities grow. Its steps are empowering services; enabling services belong to transactions.",
    check(ws) {
      const out = [];
      for (const le of ofType(ws, "learning-engine")) {
        for (const id of refsOf(le, "steps")) {
          const s = ws.byId.get(id);
          if (s?.type === "service" && s.attributes.kind !== "empowering") out.push({ ...at(le), message: `Step ${id} is a ${s.attributes.kind} service` });
        }
      }
      return out;
    },
  },
  {
    code: "W005",
    severity: "warning",
    title: "Experience without transactions",
    rationale: "An experience is made of transactions. Without them the experience canvas has nothing at its core.",
    check(ws) {
      return ofType(ws, "experience")
        .filter((e) => refsOf(e, "transactions").length === 0)
        .map((e) => ({ ...at(e), message: `${e.title} lists no transactions` }));
    },
  },
  {
    code: "W006",
    severity: "warning",
    title: "Motivation between unrelated entities",
    rationale: "If one entity offers another something, there should be a transaction through which it happens.",
    check(ws) {
      const pairs = new Set(ofType(ws, "transaction").flatMap((t) => [`${t.attributes.from}>${t.attributes.to}`, `${t.attributes.to}>${t.attributes.from}`]));
      return ofType(ws, "motivation")
        .filter((m) => m.attributes.from !== m.attributes.to && !pairs.has(`${m.attributes.from}>${m.attributes.to}`))
        .map((m) => ({ ...at(m), message: `No transaction connects ${m.attributes.from} and ${m.attributes.to}` }));
    },
  },
  {
    code: "W007",
    severity: "warning",
    title: "Transaction outside its experience",
    rationale: "An experience can only include transactions between the entities that take part in it.",
    check(ws) {
      const out = [];
      for (const x of ofType(ws, "experience")) {
        const members = new Set(refsOf(x, "entities"));
        for (const id of refsOf(x, "transactions")) {
          const t = ws.byId.get(id);
          if (t?.type !== "transaction") continue;
          const missing = [t.attributes.from, t.attributes.to].filter((p) => p && !members.has(p));
          if (missing.length) out.push({ ...at(x), message: `${id} involves ${missing.join(", ")}, not listed in entities` });
        }
      }
      return out;
    },
  },
  {
    code: "H001",
    severity: "hint",
    title: "Incomplete portrait",
    rationale: "Pressures and gains explain why an entity would join the platform at all. Without them the motivations are guesses.",
    check(ws) {
      return ofType(ws, "entity")
        .filter((e) => refsOf(e, "pressures").length === 0 || refsOf(e, "gains").length === 0)
        .map((e) => ({ ...at(e), message: `${e.title}'s portrait lacks ${refsOf(e, "pressures").length ? "gains" : "pressures"}` }));
    },
  },
  {
    code: "H002",
    severity: "hint",
    title: "Peer without a learning engine",
    rationale: "Platforms create lasting value by helping peers improve. A peer role without a learning engine only transacts.",
    check(ws) {
      const served = new Set(ofType(ws, "learning-engine").map((l) => l.attributes.entity));
      return ofType(ws, "entity")
        .filter((e) => e.attributes.role?.startsWith("peer-") && !served.has(e.id))
        .map((e) => ({ ...at(e), message: `No learning engine helps ${e.title} evolve` }));
    },
  },
  {
    code: "H003",
    severity: "hint",
    title: "Potential transaction in no experience",
    rationale: "Potential transactions are what the platform promises to make possible. If no experience includes one, nobody designed how it happens.",
    check(ws) {
      const covered = new Set(ofType(ws, "experience").flatMap((x) => refsOf(x, "transactions")));
      return ofType(ws, "transaction")
        .filter((t) => t.attributes.status === "potential" && !covered.has(t.id))
        .map((t) => ({ ...at(t), message: `${t.title} is potential but belongs to no experience` }));
    },
  },
  {
    code: "H004",
    severity: "hint",
    title: "Experience without MVP",
    rationale: "An experience is a hypothesis until tested. An MVP names the test.",
    check(ws) {
      const tested = new Set(ofType(ws, "mvp").map((m) => m.attributes.experience));
      return ofType(ws, "experience")
        .filter((x) => !tested.has(x.id))
        .map((x) => ({ ...at(x), message: `No MVP tests ${x.title}` }));
    },
  },
  {
    code: "H005",
    severity: "hint",
    title: "MVP without metrics",
    rationale: "An MVP without metrics cannot fail, so it cannot teach anything.",
    check(ws) {
      return ofType(ws, "mvp")
        .filter((m) => refsOf(m, "metrics").length === 0)
        .map((m) => ({ ...at(m), message: `${m.title} has no metrics` }));
    },
  },
];

export function validate(ws) {
  const out = [];
  for (const rule of RULES) {
    for (const d of rule.check(ws)) {
      if (ws.ignores.get(d.file)?.has(rule.code)) continue;
      out.push({ code: rule.code, severity: rule.severity, ...d });
    }
  }
  const order = { error: 0, warning: 1, hint: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
}
