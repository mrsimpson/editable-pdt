import { genericRules } from "@cli42/lib/rules";
import { createValidator } from "@cli42/lib/validator";
import type { Diagnostic as LibDiagnostic, Rule as LibRule, RuleDocs } from "@cli42/lib/validator";
import { elementsOf, fieldValue, get, titleOf, type Element, type Workspace } from "./model.ts";
import {
  BLOCK_SCHEMAS,
  BLOCK_TYPES,
  blockMeta,
  crossReferences,
  PEER_ROLES,
  type BlockType,
} from "./schemas.ts";
import { canvasById, STEPS } from "./methodology.ts";
import { canvasScope } from "./canvases.ts";

// The rule registry. Each rule describes itself — `pdt42 rules` prints the registry — and names the
// methodology step it belongs to, so `pdt42 guide` can show a step's open findings.
//
// The rules every *42 language has (EGxx, WGxx: duplicate ids, blocks that cannot be built,
// unknown attributes, blocks without prose, ids off their scheme …) come from @cli42/lib/rules;
// the validation engine and its ignore directives from @cli42/lib/validator.
//
//   error    the model is broken
//   warning  the model contradicts itself or the method
//   hint     the design has a gap the method would fill

export type Severity = "error" | "warning" | "hint";

export interface RuleMeta {
  code: string;
  severity: Severity;
  title: string;
  rationale: string;
  step?: string;
}

export interface Finding {
  message: string;
  /** For rules spanning several steps: the step this finding belongs to. */
  step?: string;
  file: string;
  line: number;
  element?: string;
}

export interface Rule {
  meta: RuleMeta;
  check(ws: Workspace): Finding[];
}

/** A finding of the validator: where, which rule, and — for pdt42's rules — element and step. */
export interface Diagnostic extends LibDiagnostic {
  element?: string;
  step?: string;
}

// Findings point at the element's block (`field` names the attribute the finding is about).
const at = (e: Element, _field?: string): Pick<Finding, "file" | "line" | "element"> => ({
  file: e.loc.file,
  line: e.loc.line,
  element: e.id,
});

const isPeer = (e: Element<"entity">) => (PEER_ROLES as readonly string[]).includes(e.role ?? "");
const hasPhase = (ws: Workspace, phase: string) =>
  ws.elements.some((e) => STEPS.find((s) => s.id === blockMeta(e.kind).step)?.phase === phase);
const designStarted = (ws: Workspace) => hasPhase(ws, "design");
const growthStarted = (ws: Workspace) => hasPhase(ws, "growth");
const coreRelationships = (ws: Workspace) => elementsOf(ws, "relationship").filter((r) => r.core);
const partiesOf = (t: Element<"transaction">) => [t.from, t.to];

function rule(meta: RuleMeta, check: (ws: Workspace) => Finding[]): Rule {
  return { meta, check };
}

const PDT_RULES: Rule[] = [
  // ── Errors ────────────────────────────────────────────────────────────────
  rule(
    {
      code: "E002",
      severity: "error",
      title: "Unresolved reference",
      rationale:
        "A reference to a missing element — or to one of the wrong type — breaks every canvas that draws it.",
    },
    (ws) => {
      const targets = new Map(crossReferences().map((r) => [`${r.from}.${r.field}`, r.to]));
      return ws.references.flatMap((ref) => {
        const target = ws.byId.get(ref.to);
        const allowed = targets.get(`${ref.from.kind}.${ref.field}`) ?? [];
        if (!target)
          return [
            {
              file: ref.loc.file,
              line: ref.loc.line,
              element: ref.from.id,
              message: `${ref.field}: "${ref.to}" does not exist`,
            },
          ];
        if (!allowed.includes(target.kind)) {
          return [
            {
              file: ref.loc.file,
              line: ref.loc.line,
              element: ref.from.id,
              message: `${ref.field}: "${ref.to}" is a ${target.kind}, expected ${allowed.join(" or ")}`,
            },
          ];
        }
        return [];
      });
    },
  ),
  rule(
    {
      code: "E005",
      severity: "error",
      title: "More than one singleton",
      rationale: "A workspace describes one ecosystem, one platform strategy and one brief.",
    },
    (ws) =>
      (["ecosystem", "platform", "brief"] as BlockType[]).flatMap((kind) =>
        ws.elements
          .filter((e) => e.kind === kind)
          .slice(1)
          .map((e) => ({
            ...at(e),
            message: `Only one :::${kind} block is allowed per workspace`,
          })),
      ),
  ),

  rule(
    {
      code: "E006",
      severity: "error",
      title: "Invalid canvas",
      rationale:
        "A :::canvas block names one of the PDT canvases; canvases drawn once per element (a portrait, a transactions board …) say which element with `of`, and it must exist and have the right type.",
    },
    (ws) => {
      const out: Finding[] = [...ws.canvasIssues];
      const seen = new Map<string, string>();
      for (const view of ws.canvases) {
        const info = canvasById(view.canvas)!;
        const at = { file: view.loc.file, line: view.loc.line };
        const first = seen.get(view.id);
        if (first || ws.byId.has(view.id)) {
          out.push({
            ...at,
            message: `Id "${view.id}" is already used${first ? ` at ${first}` : " by an element"}`,
          });
        }
        seen.set(view.id, `${view.loc.file}:${view.loc.line}`);
        if (info.per && !view.of) {
          out.push({
            ...at,
            message: `The ${info.title} is drawn once per ${info.per}: add \`of: <${info.per} id>\``,
          });
        } else if (!info.per && view.of) {
          out.push({
            ...at,
            message: `The ${info.title} is drawn once per workspace: remove \`of\``,
          });
        } else if (info.per && view.of) {
          const target = ws.byId.get(view.of);
          if (!target) out.push({ ...at, message: `of: "${view.of}" does not exist` });
          else if (target.kind !== info.per) {
            out.push({
              ...at,
              message: `of: "${view.of}" is a ${target.kind}, expected ${info.per}`,
            });
          }
        }
      }
      return out;
    },
  ),

  // ── Warnings ──────────────────────────────────────────────────────────────
  rule(
    {
      code: "W002",
      severity: "warning",
      title: "Relationship not between two entities",
      rationale:
        "PDT designs around two-sided relationships: a relationship connects exactly two different entity-roles.",
      step: "D4",
    },
    (ws) =>
      elementsOf(ws, "relationship")
        .filter((r) => r.between.length !== 2 || r.between[0] === r.between[1])
        .map((r) => ({
          ...at(r, "between"),
          message: `${r.title} must connect two different entity-roles`,
        })),
  ),
  rule(
    {
      code: "W003",
      severity: "warning",
      title: "Transaction outside its relationship",
      rationale:
        "A Transactions Board explores one relationship: its transactions happen between the two roles of that relationship.",
      step: "D5",
    },
    (ws) =>
      elementsOf(ws, "transaction").flatMap((t) => {
        const r = get(ws, "relationship", t.relationship);
        if (!r) return [];
        const outside = partiesOf(t).filter((p) => !r.between.includes(p));
        return outside.length
          ? [
              {
                ...at(t, "relationship"),
                message: `${t.title} involves ${outside.join(", ")}, not part of ${r.title}`,
              },
            ]
          : [];
      }),
  ),
  rule(
    {
      code: "W004",
      severity: "warning",
      title: "Transaction with itself",
      rationale:
        "A transaction exchanges a value unit between two entity-roles; what happens inside one role belongs to its portrait.",
      step: "D5",
    },
    (ws) =>
      elementsOf(ws, "transaction")
        .filter((t) => t.from === t.to)
        .map((t) => ({ ...at(t, "to"), message: `${t.title} goes from ${t.from} to itself` })),
  ),
  rule(
    {
      code: "W005",
      severity: "warning",
      title: "Experience point of view outside its relationship",
      rationale:
        "An experience takes one point of view in one relationship: the core role must be part of it.",
      step: "D7",
    },
    (ws) =>
      elementsOf(ws, "experience").flatMap((x) => {
        const r = get(ws, "relationship", x.relationship);
        return r && !r.between.includes(x["core-entity"])
          ? [
              {
                ...at(x, "core-entity"),
                message: `${x["core-entity"]} is not part of ${r.title}`,
              },
            ]
          : [];
      }),
  ),
  rule(
    {
      code: "W006",
      severity: "warning",
      title: "Experience step with roles outside the experience",
      rationale:
        "The involved roles (A core, B–E) must include every party of the experience's transactions.",
      step: "D7",
    },
    (ws) =>
      elementsOf(ws, "experience").flatMap((x) => {
        const involved = new Set([x["core-entity"], ...x.roles]);
        return x.steps.flatMap((stepId) => {
          const t = get(ws, "transaction", stepId);
          const missing = t ? partiesOf(t).filter((p) => !involved.has(p)) : [];
          return missing.length
            ? [
                {
                  ...at(x, "steps"),
                  message: `Step ${stepId} involves ${missing.join(", ")}, not listed as core entity or roles`,
                },
              ]
            : [];
        });
      }),
  ),
  rule(
    {
      code: "W007",
      severity: "warning",
      title: "Learning engine for an impact role",
      rationale:
        "The learning engine helps participants — consumers, producers, partners — improve; owners and stakeholders are not its subjects.",
      step: "D6",
    },
    (ws) =>
      elementsOf(ws, "learning-engine").flatMap((le) => {
        const entity = get(ws, "entity", le.entity);
        return entity && (entity.role === "owner" || entity.role === "stakeholder")
          ? [
              {
                ...at(le, "entity"),
                message: `${entity.title} is a ${entity.role}, not a participant`,
              },
            ]
          : [];
      }),
  ),
  rule(
    {
      code: "W008",
      severity: "warning",
      title: "Platform owner without the owner role",
      rationale:
        "The platform's owners appear on the Ecosystem Canvas as platform owners — their role must say so.",
      step: "D1",
    },
    (ws) =>
      elementsOf(ws, "platform").flatMap((p) =>
        p.owners.flatMap((id) => {
          const e = get(ws, "entity", id);
          return e && e.role !== "owner"
            ? [
                {
                  ...at(p, "owners"),
                  message: `${e.title} owns the platform but has role ${e.role ?? "(none)"}`,
                },
              ]
            : [];
        }),
      ),
  ),
  rule(
    {
      code: "W009",
      severity: "warning",
      title: "MVP without assumptions",
      rationale:
        "An MVP exists to test the riskiest assumptions; without them it cannot fail, so it cannot teach.",
      step: "D8",
    },
    (ws) => {
      const tested = new Set(elementsOf(ws, "assumption").map((a) => a.mvp));
      return elementsOf(ws, "mvp")
        .filter((m) => !tested.has(m.id))
        .map((m) => ({ ...at(m), message: `${m.title} tests no assumption` }));
    },
  ),
  rule(
    {
      code: "W010",
      severity: "warning",
      title: "Experience service for nobody involved",
      rationale:
        "A platform-to-entity service in an experience must be offered to one of the roles taking part in it.",
      step: "D7",
    },
    (ws) =>
      elementsOf(ws, "experience").flatMap((x) => {
        const involved = new Set([x["core-entity"], ...x.roles]);
        return x.steps.flatMap((stepId) => {
          const s = get(ws, "service", stepId);
          return s && s.for.length && !s.for.some((f) => involved.has(f))
            ? [
                {
                  ...at(x, "steps"),
                  message: `Service ${stepId} is offered to ${s.for.join(", ")}, none of whom take part`,
                },
              ]
            : [];
        });
      }),
  ),

  rule(
    {
      code: "H010",
      severity: "hint",
      title: "Orphan element",
      rationale:
        "The canvases are views over one connected model. An element that references nothing and that nothing references appears on at most one canvas and cannot be traced.",
    },
    (ws) => {
      const connected = new Set(ws.references.flatMap((r) => [r.from.id, r.to]));
      const roots: BlockType[] = ["ecosystem", "platform", "brief"];
      return ws.elements
        .filter((e) => !roots.includes(e.kind) && !connected.has(e.id))
        .map((e) => ({
          ...at(e),
          message: `${titleOf(e)} is connected to nothing else in the model`,
        }));
    },
  ),
  rule(
    {
      code: "H011",
      severity: "hint",
      title: "Unlinked phase handoff",
      rationale:
        "The platform shapes the ecosystem explored in phase 1 and starts from its brief; linking them keeps exploration and design traceable.",
      step: "D1",
    },
    (ws) =>
      elementsOf(ws, "platform").flatMap((p) => {
        const missing = [
          elementsOf(ws, "ecosystem").length && !p.ecosystem ? "ecosystem" : "",
          elementsOf(ws, "brief").length && !p.brief ? "brief" : "",
        ].filter(Boolean);
        return missing.length
          ? [
              {
                ...at(p),
                message: `The platform does not reference the ${missing.join(" and ")} that exist in this workspace`,
              },
            ]
          : [];
      }),
  ),

  rule(
    {
      code: "W011",
      severity: "warning",
      title: "Chapter without its canvas",
      rationale:
        "The canvases are how a platform design is read and discussed. Every chapter shows the canvas of its step, drawn from the model with a :::canvas block, so the picture can never drift from the model.",
    },
    (ws) => chapterCanvasFindings(ws),
  ),

  // ── Hints: exploration ────────────────────────────────────────────────────
  rule(
    {
      code: "H001",
      severity: "hint",
      title: "No focus arena",
      rationale:
        "Exploration narrows down: the FOCUS area marks the arenas you can act on, and step E4 keeps one.",
      step: "E4",
    },
    (ws) => {
      const arenas = elementsOf(ws, "arena");
      return arenas.length && !arenas.some((a) => a.focus)
        ? [{ ...at(arenas[0]!), message: "No arena has `focus: yes`" }]
        : [];
    },
  ),
  rule(
    {
      code: "H002",
      severity: "hint",
      title: "Asset not fully VRIO",
      rationale:
        "Only assets that are valuable, rare, inimitable and that you are organised to exploit ground an advantage.",
      step: "E3",
    },
    (ws) =>
      elementsOf(ws, "asset")
        .filter((a) => a.vrio !== "vrio")
        .map((a) => ({
          ...at(a, "vrio"),
          message: `${a.title} stops at "${a.vrio}" — treat it as supporting, not as an advantage`,
        })),
  ),
  rule(
    {
      code: "H003",
      severity: "hint",
      title: "Brief outside the focus",
      rationale: "The brief consolidates the arena chosen in step E4.",
      step: "E7",
    },
    (ws) =>
      elementsOf(ws, "brief").flatMap((b) => {
        const arena = get(ws, "arena", b.arena);
        return arena && !arena.focus
          ? [{ ...at(b, "arena"), message: `${arena.title} is not marked as focus arena` }]
          : [];
      }),
  ),

  // ── Hints: design ─────────────────────────────────────────────────────────
  rule(
    {
      code: "H101",
      severity: "hint",
      title: "Entity without role",
      rationale:
        "On the Ecosystem Canvas every entity-role plays one of the five platform roles; without it the entity is not on the canvas.",
      step: "D1",
    },
    (ws) =>
      designStarted(ws)
        ? elementsOf(ws, "entity")
            .filter((e) => !e.role)
            .map((e) => ({ ...at(e), message: `${e.title} has no role` }))
        : [],
  ),
  rule(
    {
      code: "H102",
      severity: "hint",
      title: "Too many peer roles",
      rationale:
        "PDT recommends at most five entity-roles in the peer spectrum: cluster similar ones or pick the five to start with.",
      step: "D1",
    },
    (ws) => {
      const peers = elementsOf(ws, "entity").filter(isPeer);
      return peers.length > 5
        ? [
            {
              ...at(peers[5]!),
              message: `${peers.length} peer roles — consider clustering down to five`,
            },
          ]
        : [];
    },
  ),
  rule(
    {
      code: "H103",
      severity: "hint",
      title: "No platform block",
      rationale:
        "The platform block holds the narrative, the owners and the core entity that the canvases centre on.",
      step: "D1",
    },
    (ws) => {
      const first = elementsOf(ws, "entity").find((e) => e.role);
      return first && !elementsOf(ws, "platform").length
        ? [{ ...at(first), message: "Add a :::platform block with its owners" }]
        : [];
    },
  ),
  rule(
    {
      code: "H104",
      severity: "hint",
      title: "Incomplete portrait",
      rationale:
        "Potential, compressors and gains explain why a role would join; without them value propositions are guesses.",
      step: "D2",
    },
    (ws) =>
      elementsOf(ws, "entity")
        .filter(isPeer)
        .flatMap((e) => {
          const d = e;
          const missing = [
            !(d.assets.length || d.capabilities.length || d.potential.length) && "potential",
            !(d.goals.length || d.pressures.length) && "goals or pressures",
            !(
              d["convenience-gains"].length ||
              d["reach-gains"].length ||
              d["value-gains"].length
            ) && "gains",
          ].filter(Boolean);
          return missing.length
            ? [{ ...at(e), message: `${e.title}'s portrait lacks ${missing.join(", ")}` }]
            : [];
        }),
  ),
  rule(
    {
      code: "H105",
      severity: "hint",
      title: "Peer role missing from the motivations matrix",
      rationale:
        "The Motivations Matrix asks what every role can give every other; a role that neither gives nor receives shows an unexplored relationship.",
      step: "D3",
    },
    (ws) => {
      const motivations = elementsOf(ws, "motivation");
      if (!motivations.length) return [];
      const involved = new Set(motivations.flatMap((m) => [m.from, m.to]));
      return elementsOf(ws, "entity")
        .filter((e) => isPeer(e) && !involved.has(e.id))
        .map((e) => ({
          ...at(e),
          message: `${e.title} neither gives nor receives anything in the matrix`,
        }));
    },
  ),
  rule(
    {
      code: "H106",
      severity: "hint",
      title: "No core relationship",
      rationale:
        "Step D4 focuses the design: one to three core relationships and a core entity whose point of view comes first.",
      step: "D4",
    },
    (ws) => {
      const out: Finding[] = [];
      const platform = elementsOf(ws, "platform")[0];
      const firstMotivation = elementsOf(ws, "motivation")[0];
      if (firstMotivation && !coreRelationships(ws).length) {
        out.push({ ...at(firstMotivation), message: "No relationship is marked `core: yes`" });
      }
      if (platform && firstMotivation && !platform["core-entity"]) {
        out.push({ ...at(platform), message: "The platform has no core-entity" });
      }
      const core = platform?.["core-entity"];
      if (
        core &&
        coreRelationships(ws).length &&
        !coreRelationships(ws).some((r) => r.between.includes(core))
      ) {
        out.push({
          ...at(platform!, "core-entity"),
          message: `The core entity ${core} is part of no core relationship`,
        });
      }
      return out;
    },
  ),
  rule(
    {
      code: "H107",
      severity: "hint",
      title: "Core relationship without transactions",
      rationale: "Every core relationship gets its own Transactions Board.",
      step: "D5",
    },
    (ws) => {
      const covered = new Set(elementsOf(ws, "transaction").map((t) => t.relationship));
      return coreRelationships(ws)
        .filter((r) => !covered.has(r.id))
        .map((r) => ({ ...at(r), message: `${r.title} has no transactions yet` }));
    },
  ),
  rule(
    {
      code: "H108",
      severity: "hint",
      title: "Transaction without value unit, channel or relationship",
      rationale:
        "Value units let you attach a business model later; channels are where the platform lowers the transaction cost; the relationship places the row on its board.",
      step: "D5",
    },
    (ws) =>
      elementsOf(ws, "transaction").flatMap((t) => {
        const missing = [
          !t["value-unit"] && "value-unit",
          !t.channel && "channel",
          !t.relationship && "relationship",
        ].filter(Boolean);
        return missing.length
          ? [{ ...at(t), message: `${t.title} has no ${missing.join(", ")}` }]
          : [];
      }),
  ),
  rule(
    {
      code: "H109",
      severity: "hint",
      title: "Participant without learning engine",
      rationale:
        "Platforms create lasting value by helping participants improve; a role in a core relationship without a learning engine only transacts.",
      step: "D6",
    },
    (ws) => {
      const served = new Set(elementsOf(ws, "learning-engine").map((l) => l.entity));
      const core = new Set(coreRelationships(ws).flatMap((r) => r.between));
      return elementsOf(ws, "entity")
        .filter((e) => isPeer(e) && core.has(e.id) && !served.has(e.id))
        .map((e) => ({ ...at(e), message: `No learning engine helps ${e.title} evolve` }));
    },
  ),
  rule(
    {
      code: "H110",
      severity: "hint",
      title: "Learning challenge without service",
      rationale:
        "Each stage's key challenges are met by one or few services; a challenge without a service is a promise the platform does not keep.",
      step: "D6",
    },
    (ws) =>
      elementsOf(ws, "learning-engine").flatMap((le) =>
        (["onboarding", "getting-better", "new-opportunity"] as const).flatMap((stage) => {
          if (!le[stage].length) return [];
          const served = elementsOf(ws, "service").some(
            (s) => s.stage === stage && s.for.includes(le.entity),
          );
          return served
            ? []
            : [
                {
                  ...at(le, stage),
                  message: `${titleOf(le)}: ${stage} challenges have no service for ${le.entity}`,
                },
              ];
        }),
      ),
  ),
  rule(
    {
      code: "H111",
      severity: "hint",
      title: "Experience with one kind of brick",
      rationale:
        "A platform experience mixes entity-to-entity transactions with platform-to-entity services.",
      step: "D7",
    },
    (ws) =>
      elementsOf(ws, "experience").flatMap((x) => {
        const kinds = new Set(x.steps.map((id) => ws.byId.get(id)?.kind).filter(Boolean));
        if (!x.steps.length) return [{ ...at(x), message: `${x.title} has no steps` }];
        if (!kinds.has("service"))
          return [
            { ...at(x, "steps"), message: `${x.title} has no platform service among its steps` },
          ];
        if (!kinds.has("transaction"))
          return [{ ...at(x, "steps"), message: `${x.title} has no transaction among its steps` }];
        return [];
      }),
  ),
  rule(
    {
      code: "H112",
      severity: "hint",
      title: "Experience without business model",
      rationale:
        "Once the flow of value is visible, the experience needs a sustainability model: what it costs and how value is captured.",
      step: "D7",
    },
    (ws) =>
      elementsOf(ws, "experience")
        .filter((x) => !x.revenues.length || !x.costs.length)
        .map((x) => ({
          ...at(x),
          message: `${x.title} has no ${!x.revenues.length ? "revenues" : "costs"}`,
        })),
  ),
  rule(
    {
      code: "H113",
      severity: "hint",
      title: "Experience in no MVP",
      rationale: "An experience is a hypothesis until an MVP tests it.",
      step: "D8",
    },
    (ws) => {
      const tested = new Set(elementsOf(ws, "mvp").flatMap((m) => m.experiences));
      return elementsOf(ws, "experience")
        .filter((x) => !tested.has(x.id))
        .map((x) => ({ ...at(x), message: `No MVP tests ${x.title}` }));
    },
  ),
  rule(
    {
      code: "H114",
      severity: "hint",
      title: "MVP without the three essential assumptions",
      rationale:
        "Validate business model, trust and attraction as early as possible — and know which assumption is the riskiest.",
      step: "D8",
    },
    (ws) =>
      elementsOf(ws, "mvp").flatMap((m) => {
        const own = elementsOf(ws, "assumption").filter((a) => a.mvp === m.id);
        if (!own.length) return [];
        const kinds = new Set(own.map((a) => a.category));
        const missing = (["business-model", "trust", "attraction"] as const).filter(
          (k) => !kinds.has(k),
        );
        const out: Finding[] = [];
        if (missing.length)
          out.push({ ...at(m), message: `${m.title} tests no ${missing.join(", ")} assumption` });
        if (!own.some((a) => a.riskiest))
          out.push({ ...at(m), message: `${m.title} marks no assumption as riskiest` });
        return out;
      }),
  ),
  rule(
    {
      code: "H115",
      severity: "hint",
      title: "Assumption without test or criteria",
      rationale: "Each assumption needs a way to test it and an unbiased validation criterion.",
      step: "D8",
    },
    (ws) =>
      elementsOf(ws, "assumption")
        .filter((a) => !a.test || !a.criteria)
        .map((a) => ({
          ...at(a),
          message: `${a.title} has no ${!a.test ? "test" : "criteria"}`,
        })),
  ),

  // ── Hints: growth ─────────────────────────────────────────────────────────
  rule(
    {
      code: "H201",
      severity: "hint",
      title: "Core relationship without network properties",
      rationale:
        "Network effects depend on the relationship underlying the network; its seven properties drive tactics and defensibility.",
      step: "G2",
    },
    (ws) => {
      if (!growthStarted(ws)) return [];
      const covered = new Set(elementsOf(ws, "network").map((n) => n.relationship));
      return coreRelationships(ws)
        .filter((r) => !covered.has(r.id))
        .map((r) => ({ ...at(r), message: `${r.title} has no network properties` }));
    },
  ),
  rule(
    {
      code: "H202",
      severity: "hint",
      title: "No core network flywheel",
      rationale:
        "Reinforcing flywheels compound on a core network effect (direct or indirect) — start from one.",
      step: "G3",
    },
    (ws) => {
      const flywheels = elementsOf(ws, "flywheel");
      return flywheels.length &&
        !flywheels.some((f) => f.type === "direct-network" || f.type === "indirect-network")
        ? [
            {
              ...at(flywheels[0]!),
              message: "No flywheel of type direct-network or indirect-network",
            },
          ]
        : [];
    },
  ),
  rule(
    {
      code: "H204",
      severity: "hint",
      title: "Growth element without its anchor",
      rationale:
        "A flywheel grows out of a relationship's network effect; a growth loop brings a role onto the platform and spins a flywheel.",
      step: "G3",
    },
    (ws) => [
      ...elementsOf(ws, "flywheel")
        .filter((f) => !f.relationship && !f.reinforces)
        .map((f) => ({
          ...at(f),
          message: `${f.title} names neither the relationship it grows from nor the flywheel it reinforces`,
        })),
      ...elementsOf(ws, "growth-loop")
        .filter((g) => !g.acquires || !g.feeds)
        .map((g) => ({
          ...at(g),
          message: `${g.title} does not say ${!g.acquires ? "which role it acquires" : "which flywheel it feeds"}`,
        })),
    ],
  ),
  rule(
    {
      code: "H203",
      severity: "hint",
      title: "Core relationship without liquidity plan",
      rationale:
        "Liquidity is to marketplaces what product-market fit is to products; plan where and how to reach it.",
      step: "G4",
    },
    (ws) => {
      if (!growthStarted(ws)) return [];
      const planned = new Set(elementsOf(ws, "liquidity").map((l) => l.relationship));
      return coreRelationships(ws)
        .filter((r) => !planned.has(r.id))
        .map((r) => ({ ...at(r), message: `${r.title} has no liquidity plan` }));
    },
  ),
];

// ── The rules every *42 language has ────────────────────────────────────────

/** The chapter of each methodology file: its position among the steps' files. */
const CHAPTER_FILES = [...new Set(STEPS.map((step) => step.file))];
const basename = (path: string) => path.split("/").pop() ?? path;

/** The chapter a file is by the methodology's convention, or null for any other file. */
function chapterOfFile(path: string): number | null {
  const index = CHAPTER_FILES.findIndex((file) => basename(file) === basename(path));
  return index < 0 ? null : index + 1;
}

/** The chapter of each block type: the file of the step that introduces it (EG03). */
const CHAPTERS = Object.fromEntries(
  BLOCK_TYPES.map((kind) => {
    const step = STEPS.find((s) => s.id === blockMeta(kind).step);
    return [kind, step ? CHAPTER_FILES.indexOf(step.file) + 1 : 0];
  }),
) as Record<BlockType, number>;

/** The documents as the generic rules read them: canvases are views, not blocks of the model. */
function modelView(ws: Workspace) {
  return {
    ...ws,
    documents: ws.documents.map((doc) => ({
      ...doc,
      nodes: doc.nodes.filter((n) => !(n.kind === "block" && n.blockType === "canvas")),
    })),
  };
}

const GENERIC_RULES: Rule[] = genericRules({
  chapters: CHAPTERS,
  chapterOfFile,
  fenceFlag: "inPdt42Fence",
  fenceDescription: () => "```pdt42 fence",
  schemas: BLOCK_SCHEMAS,
}).map((generic) => ({
  meta: {
    code: generic.meta.code,
    severity: generic.meta.severity,
    title: generic.meta.docs.description,
    rationale: generic.meta.docs.rationale,
  },
  check: (ws) =>
    generic
      .check(modelView(ws), undefined)
      .map(({ message, file, line }) => ({ message, file, line })),
}));

/** Every rule: the generic ones first (EGxx, WGxx), then pdt42's own. */
export const RULES: Rule[] = [...GENERIC_RULES, ...PDT_RULES];

interface PdtRuleDocs extends RuleDocs {
  step?: string;
}

/** A rule as the validation engine runs it: findings with code, severity and step. */
function engineRule(rule: Rule): LibRule<Workspace, undefined, undefined, PdtRuleDocs> {
  return {
    meta: {
      code: rule.meta.code,
      severity: rule.meta.severity,
      type: rule.meta.severity === "hint" ? "suggestion" : "problem",
      docs: {
        description: rule.meta.title,
        rationale: rule.meta.rationale,
        recommended: true,
        ...(rule.meta.step ? { step: rule.meta.step } : {}),
      },
    },
    check: (ws) =>
      rule.check(ws).map(
        (finding): Diagnostic => ({
          ...finding,
          code: rule.meta.code,
          severity: rule.meta.severity,
          ...((finding.step ?? rule.meta.step) ? { step: finding.step ?? rule.meta.step } : {}),
        }),
      ),
  };
}

const validator = createValidator({ rules: RULES.map(engineRule) });

export function validate(ws: Workspace): Diagnostic[] {
  const order: Record<Severity, number> = { error: 0, warning: 1, hint: 2 };
  return (validator.validate(ws, undefined) as Diagnostic[]).sort(
    (a, b) =>
      order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line,
  );
}

/** W011: for every started step with a canvas, the canvas is placed in the step's chapter. */
function chapterCanvasFindings(ws: Workspace): Finding[] {
  const out: Finding[] = [];
  for (const step of STEPS) {
    if (!step.canvas) continue;
    const canvas = canvasById(step.canvas)!;
    const own = step.blocks.length
      ? ws.elements.filter((e) => (step.blocks as string[]).includes(e.kind))
      : ws.elements.filter((e) =>
          (step.enriches ?? []).some(
            ({ type, fields }) =>
              e.kind === type &&
              fields.some((f) => {
                const v = fieldValue(e, f);
                return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
              }),
          ),
        );
    if (!own.length) continue;
    const chapterFiles = new Set(own.map((e) => e.loc.file));
    const placed = ws.canvases.filter(
      (v) => v.canvas === canvas.id && chapterFiles.has(v.loc.file),
    );
    const hint = (of?: string) =>
      `add a \`:::canvas\` block with \`canvas: ${canvas.id}\`${of ? ` and \`of: ${of}\`` : ""}`;
    const scope = canvasScope(ws, canvas.id);
    if (!scope) {
      if (!placed.length) {
        out.push({
          ...at(own[0]!),
          step: step.id,
          message: `${own[0]!.loc.file} (${step.id} ${step.title}) shows no ${canvas.title} — ${hint()}`,
        });
      }
      continue;
    }
    for (const target of scope) {
      if (placed.some((v) => v.of === target.id)) continue;
      const anchor =
        own.find((e) => ws.references.some((r) => r.from === e && r.to === target.id)) ??
        own.find((e) => e.id === target.id) ??
        own[0]!;
      out.push({
        ...at(anchor),
        step: step.id,
        message: `No ${canvas.title} for ${titleOf(target)} in ${[...chapterFiles].join(", ")} — ${hint(target.id)}`,
      });
    }
  }
  return out;
}
