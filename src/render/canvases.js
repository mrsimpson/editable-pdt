import { CANVASES, ROLES, roleOf } from "../core/schema.js";
import { esc, firstSentence, markdown } from "./markdown.js";

// Canvas renderers. Each one takes the workspace model (as produced by
// toJSON) and returns an HTML string. Stickies carry data-id so the editor
// can open the element behind them; "add" buttons carry the block type and
// preset attributes of the zone they sit in.

export const FLOWS = [
  { id: "information", label: "Information" },
  { id: "value", label: "Goods & services" },
  { id: "money", label: "Money" },
  { id: "reputation", label: "Reputation & attention" },
];

export function renderCanvas(model, canvasId, options = {}) {
  const ctx = context(model, options);
  const renderer = { ecosystem, portraits, motivations, transactions, learning, experiences, mvp }[canvasId];
  return renderer ? renderer(ctx) : "";
}

function context(model) {
  const byId = new Map(model.elements.map((e) => [e.id, e]));
  const of = (type) => model.elements.filter((e) => e.type === type);
  const roleRank = (e) => ROLES.findIndex((r) => r.id === e.attributes.role);
  const entities = of("entity").slice().sort((a, b) => roleRank(a) - roleRank(b));
  return { model, byId, of, entities, platform: of("platform")[0] };
}

// ── Building blocks ──────────────────────────────────────────────────────────

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const tilt = (key) => ((hash(key) % 9) - 4) * 0.35;

function frame(ctx, canvasId, body, { legend = "", subtitle = "" } = {}) {
  const index = CANVASES.findIndex((c) => c.id === canvasId);
  const canvas = CANVASES[index];
  const platform = ctx.platform?.title ?? "Untitled platform";
  return `<section class="canvas canvas-${canvasId}" data-canvas="${canvasId}">
  <header class="canvas-head">
    <div class="canvas-kicker"><span class="canvas-no">${String(index + 1).padStart(2, "0")}</span>${esc(platform)}${subtitle ? ` · ${esc(subtitle)}` : ""}</div>
    <h2 class="canvas-title">${esc(canvas.title)}</h2>
    <p class="canvas-question">${esc(canvas.question)}</p>
  </header>
  <div class="canvas-body">${body}</div>
  ${legend ? `<footer class="canvas-foot">${legend}</footer>` : ""}
</section>`;
}

function zone(n, label, hint, content, { area = "", add = null, cls = "" } = {}) {
  return `<div class="zone ${cls}"${area ? ` style="grid-area:${area}"` : ""}>
    <div class="zone-label">${n ? `<span class="zone-n">${n}</span>` : ""}<span>${esc(label)}</span></div>
    ${hint ? `<p class="zone-hint">${esc(hint)}</p>` : ""}
    <div class="stickies">${content}</div>
    ${add ? addButton(add) : ""}
  </div>`;
}

function addButton({ type, preset = {}, label = "Add", field }) {
  const attrs = field ? ` data-field="${esc(field)}" data-id="${esc(preset.id)}"` : ` data-add="${esc(type)}" data-preset="${esc(JSON.stringify(preset))}"`;
  return `<button type="button" class="add"${attrs} title="${esc(label)}">+ ${esc(label)}</button>`;
}

function roleClass(entity) {
  return `role-${entity?.attributes.role ?? "none"}`;
}

function entitySticky(entity, { size = "", note = "" } = {}) {
  const role = roleOf(entity.attributes.role);
  return `<article class="sticky ${roleClass(entity)} ${size}" data-id="${esc(entity.id)}" style="--tilt:${tilt(entity.id)}deg">
    <span class="sticky-role">${esc(role?.short ?? entity.attributes.role ?? "")}</span>
    <strong class="sticky-title">${esc(entity.title)}</strong>
    ${note ? `<span class="sticky-note">${esc(note)}</span>` : ""}
  </article>`;
}

function noteSticky(text, { id, field, cls = "", key = text } = {}) {
  return `<div class="sticky note ${cls}"${id ? ` data-id="${esc(id)}"` : ""}${field ? ` data-field="${esc(field)}"` : ""} style="--tilt:${tilt(key)}deg">${esc(text)}</div>`;
}

function chip(entity) {
  if (!entity) return "";
  return `<span class="chip ${roleClass(entity)}" data-id="${esc(entity.id)}">${esc(entity.title)}</span>`;
}

function empty(text) {
  return `<p class="empty">${esc(text)}</p>`;
}

function roleLegend() {
  return `<ul class="legend">${ROLES.map((r) => `<li><span class="swatch role-${r.id}"></span>${esc(r.label)}</li>`).join("")}</ul>`;
}

function flowLegend() {
  return `<ul class="legend">${FLOWS.map((f) => `<li><span class="swatch flow-${f.id}"></span>${esc(f.label)}</li>`).join("")}
    <li><span class="line solid"></span>Existing</li><li><span class="line dashed"></span>Potential</li></ul>`;
}

function initials(title) {
  return String(title).split(/\s+/).filter((w) => /^[A-Za-zÀ-ÿ0-9]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ── 01 Ecosystem canvas ──────────────────────────────────────────────────────

function ecosystem(ctx) {
  const byRole = (role) => ctx.entities.filter((e) => e.attributes.role === role);
  const sticks = (role) => byRole(role).map((e) => entitySticky(e, { note: firstSentence(e.prose, 90) })).join("");
  const add = (role) => ({ type: "entity", preset: { role }, label: "Add entity" });
  const p = ctx.platform;
  const shapers = byRole("shaper");

  const center = `<div class="eco-core" style="grid-area:center">
    <div class="eco-orbit">
    <svg class="eco-rings" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="198"/><circle cx="200" cy="200" r="164"/><circle cx="200" cy="200" r="130"/>
    </svg>
    <div class="eco-disc"${p ? ` data-id="${esc(p.id)}"` : ""}>
      <span class="eco-disc-kicker">The platform</span>
      <strong class="eco-disc-title">${esc(p?.title ?? "Name your platform")}</strong>
      ${p?.attributes.purpose ? `<span class="eco-disc-purpose">${esc(p.attributes.purpose)}</span>` : ""}
      ${p ? "" : addButton({ type: "platform", label: "Add platform" })}
    </div>
    </div>
    <div class="eco-shapers">
      <div class="zone-label"><span class="zone-n">1</span><span>Platform Shapers</span></div>
      <div class="stickies">${shapers.map((e) => entitySticky(e, { size: "small" })).join("")}</div>
      ${addButton(add("shaper"))}
    </div>
  </div>`;

  const body = `<div class="eco-grid">
    ${zone(2, "Peer Producers", "Who creates the value exchanged on the platform?", sticks("peer-producer"), { area: "left", add: add("peer-producer"), cls: "zone-peer-producer" })}
    ${center}
    ${zone(3, "Peer Consumers", "Who consumes it?", sticks("peer-consumer"), { area: "right", add: add("peer-consumer"), cls: "zone-peer-consumer" })}
    ${zone(4, "Partners", "Who brings resources, services or capabilities the peers need?", sticks("partner"), { area: "bottom", add: add("partner"), cls: "zone-partner zone-wide" })}
    ${zone(5, "Impact Stakeholders", "Who is affected, and cares about the outcome?", sticks("stakeholder"), { area: "top", add: add("stakeholder"), cls: "zone-stakeholder zone-wide" })}
  </div>`;
  return frame(ctx, "ecosystem", body, { legend: roleLegend() });
}

// ── 02 Entity portraits ──────────────────────────────────────────────────────

function portraits(ctx) {
  if (ctx.entities.length === 0) return frame(ctx, "portraits", `${empty("No entities yet.")}${addButton({ type: "entity", preset: { role: "peer-producer" }, label: "Add entity" })}`);
  const cards = ctx.entities.map((e) => portrait(e)).join("");
  const index = `<nav class="portrait-index">${ctx.entities.map((e) => `<a class="chip ${roleClass(e)}" href="#portrait-${esc(e.id)}" onclick="event.preventDefault();document.getElementById('portrait-${esc(e.id)}').scrollIntoView({behavior:'smooth'})">${esc(e.title)}</a>`).join("")}</nav>`;
  return frame(ctx, "portraits", `${index}<div class="portraits">${cards}</div>`, { legend: roleLegend() });
}

function portrait(e) {
  const field = (n, key, label, hint, area) =>
    zone(n, label, hint, list(e.attributes[key]).map((t) => noteSticky(t, { id: e.id, field: key, cls: `tone-${key}`, key: e.id + t })).join(""), {
      area,
      add: { preset: { id: e.id }, field: key, label: "Add" },
      cls: `zone-${key}`,
    });
  return `<div class="portrait ${roleClass(e)}" id="portrait-${esc(e.id)}">
    ${field(1, "context", "Context", "Who they are, where they operate", "context")}
    ${field(2, "pressures", "Pressures", "Performance pressures and trends", "pressures")}
    <div class="portrait-core" style="grid-area:core" data-id="${esc(e.id)}">
      <div class="avatar ${roleClass(e)}">${esc(initials(e.title))}</div>
      <span class="portrait-role">${esc(roleOf(e.attributes.role)?.short ?? "")}</span>
      <h3>${esc(e.title)}</h3>
      <div class="portrait-prose">${markdown(firstSentence(e.prose, 220))}</div>
    </div>
    ${field(3, "gains", "Expected gains", "What they hope to get out of it", "gains")}
    ${field(4, "seeks", "Experience sought", "What it should feel like", "seeks")}
    ${field(5, "resources", "Resources & capabilities", "What they bring and could share", "resources")}
  </div>`;
}

// ── 03 Motivations matrix ────────────────────────────────────────────────────

function motivations(ctx) {
  const es = ctx.entities;
  if (es.length === 0) return frame(ctx, "motivations", empty("Add entities to fill the matrix."));
  const cells = new Map();
  for (const m of ctx.of("motivation")) {
    const key = `${m.attributes.from}>${m.attributes.to}`;
    cells.set(key, [...(cells.get(key) ?? []), m]);
  }
  const head = `<tr><th class="corner"><span>gives ↓</span><span>receives →</span></th>${es.map((e) => `<th scope="col" class="col-head">${chip(e)}</th>`).join("")}</tr>`;
  const rows = es
    .map((row) => {
      const tds = es
        .map((col) => {
          if (row.id === col.id) {
            const gains = list(row.attributes.gains);
            return `<td class="diag ${roleClass(row)}"><span class="diag-label">gains</span>${gains.slice(0, 3).map((g) => `<span class="diag-item" data-id="${esc(row.id)}" data-field="gains">${esc(g)}</span>`).join("")}</td>`;
          }
          const ms = cells.get(`${row.id}>${col.id}`) ?? [];
          return `<td>${ms.map((m) => noteSticky(m.attributes.gives, { id: m.id, cls: `tone-${row.attributes.role}`, key: m.id })).join("")}${addButton({ type: "motivation", preset: { from: row.id, to: col.id }, label: "" })}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${chip(row)}</th>${tds}</tr>`;
    })
    .join("");
  return frame(ctx, "motivations", `<div class="matrix-wrap"><table class="matrix" style="--cols:${es.length}">${head}${rows}</table></div>`, {
    legend: `${roleLegend()}<p class="foot-note">Each cell: what the row entity offers the column entity. The diagonal shows the gains each entity expects for itself.</p>`,
  });
}

// ── 04 Transactions board ────────────────────────────────────────────────────

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if ((cur + " " + w).length <= max) lines[lines.length - 1] = cur + " " + w;
    else lines.push(w);
  }
  return lines;
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…` : text);

function transactions(ctx) {
  const txs = ctx.of("transaction");
  const involved = new Set(txs.flatMap((t) => [t.attributes.from, t.attributes.to]));
  const lanes = ctx.entities.filter((e) => e.attributes.role !== "stakeholder" || involved.has(e.id));
  if (lanes.length === 0) return frame(ctx, "transactions", empty("Add entities and transactions to see the board."));

  const laneW = 150, left = 56, top = 124, rowH = 70, pad = 36;
  const width = left + lanes.length * laneW + 24;
  const height = top + Math.max(1, txs.length) * rowH + pad;
  const cx = new Map(lanes.map((e, i) => [e.id, left + i * laneW + laneW / 2]));

  const laneSvg = lanes
    .map((e, i) => {
      const x = left + i * laneW;
      const lines = wrap(e.title, 17).slice(0, 3);
      return `<g class="lane ${roleClass(e)}" data-id="${esc(e.id)}">
        <rect class="lane-bg" x="${x + 4}" y="8" width="${laneW - 8}" height="${height - 16}" rx="14"/>
        <rect class="lane-head" x="${x + 10}" y="18" width="${laneW - 20}" height="${top - 40}" rx="10"/>
        <rect class="lane-bar" x="${x + 10}" y="18" width="${laneW - 20}" height="5" rx="2"/>
        <text class="lane-role" x="${x + laneW / 2}" y="44">${esc(roleOf(e.attributes.role)?.short.toUpperCase() ?? "")}</text>
        ${lines.map((l, j) => `<text class="lane-title" x="${x + laneW / 2}" y="${64 + j * 16}">${esc(l)}</text>`).join("")}
        <line class="lifeline" x1="${x + laneW / 2}" y1="${top - 20}" x2="${x + laneW / 2}" y2="${height - 18}"/>
      </g>`;
    })
    .join("");

  const markers = FLOWS.map(
    (f) => `<marker id="arrow-${f.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="flow-${f.id} arrowhead"/></marker>`,
  ).join("");

  const rows = txs
    .map((t, i) => {
      const y = top + i * rowH + rowH / 2;
      const a = cx.get(t.attributes.from), b = cx.get(t.attributes.to);
      const flow = FLOWS.some((f) => f.id === t.attributes.flow) ? t.attributes.flow : "information";
      const status = t.attributes.status === "potential" ? "potential" : "existing";
      const channel = ctx.byId.get(t.attributes.channel);
      const num = `<g class="tx-num"><circle cx="28" cy="${y}" r="13"/><text x="28" y="${y + 4}">${i + 1}</text></g>`;
      if (a === undefined || b === undefined) {
        return `<g class="tx broken" data-id="${esc(t.id)}">${num}<text class="tx-title" x="${left + 12}" y="${y + 4}" text-anchor="start">${esc(t.title)} — unresolved entity</text></g>`;
      }
      const mid = (a + b) / 2;
      const span = Math.max(laneW, Math.abs(b - a));
      let path;
      if (a === b) path = `M${a},${y - 10} C${a + 70},${y - 34} ${a + 70},${y + 14} ${a + 6},${y + 6}`;
      else {
        const dir = Math.sign(b - a);
        path = `M${a + dir * 8},${y} L${b - dir * 10},${y}`;
      }
      const titleMax = Math.floor(Math.max(span, 230) / 7);
      const label = clip(t.title, titleMax);
      return `<g class="tx flow-${flow} ${status}" data-id="${esc(t.id)}">
        <title>${esc(t.title)}${channel ? ` — via ${esc(channel.title)}` : ""} (${esc(status)} ${esc(flow)})</title>
        ${num}
        <rect class="tx-hit" x="${Math.min(a, b) - 20}" y="${y - rowH / 2 + 4}" width="${Math.abs(b - a) + 40}" height="${rowH - 8}" rx="10"/>
        <circle class="tx-origin" cx="${a}" cy="${y}" r="5"/>
        <path class="tx-line" d="${path}" marker-end="url(#arrow-${flow})"/>
        <text class="tx-title" x="${a === b ? a + 40 : mid}" y="${y - 10}">${esc(label)}</text>
        ${channel ? `<text class="tx-channel" x="${a === b ? a + 40 : mid}" y="${y + 20}">via ${esc(clip(channel.title, titleMax))}</text>` : ""}
      </g>`;
    })
    .join("");

  const svg = `<svg class="board" viewBox="0 0 ${width} ${height}" width="${width}" style="min-width:${Math.min(width, 720)}px" role="img" aria-label="Transactions board">
    <defs>${markers}</defs>${laneSvg}${rows}
    ${txs.length === 0 ? `<text class="lane-title" x="${width / 2}" y="${top + 30}">No transactions yet</text>` : ""}
  </svg>`;

  const channels = ctx.of("channel");
  const channelList = `<div class="channels"><span class="zone-label"><span>Channels</span></span>${channels
    .map((c) => `<span class="pill medium-${esc(c.attributes.medium ?? "digital")}" data-id="${esc(c.id)}">${esc(c.title)}<small>${esc(c.attributes.medium ?? "")}</small></span>`)
    .join("")}${addButton({ type: "channel", preset: { medium: "digital" }, label: "Add channel" })}</div>`;

  return frame(ctx, "transactions", `<div class="board-wrap">${svg}</div>${channelList}<div class="board-actions">${addButton({ type: "transaction", preset: { flow: "value", status: "existing" }, label: "Add transaction" })}</div>`, {
    legend: flowLegend(),
  });
}

// ── 05 Learning engine ───────────────────────────────────────────────────────

function learning(ctx) {
  const engines = ctx.of("learning-engine");
  const body = engines.length
    ? engines.map((le) => engine(ctx, le)).join("")
    : empty("No learning engine yet. Describe how the platform helps an entity grow.");
  const unused = ctx.of("service").filter((s) => s.attributes.kind === "empowering" && !engines.some((le) => list(le.attributes.steps).includes(s.id)));
  const pool = unused.length
    ? `<div class="service-pool"><span class="zone-label"><span>Empowering services in no engine</span></span>${unused.map((s) => serviceCard(ctx, s)).join("")}</div>`
    : "";
  return frame(ctx, "learning", `${body}${pool}<div class="board-actions">${addButton({ type: "learning-engine", label: "Add learning engine" })}${addButton({ type: "service", preset: { kind: "empowering" }, label: "Add empowering service" })}</div>`);
}

function engine(ctx, le) {
  const entity = ctx.byId.get(le.attributes.entity);
  const steps = list(le.attributes.steps).map((id) => ctx.byId.get(id) ?? { id, title: id, attributes: {}, missing: true });
  return `<div class="engine ${roleClass(entity)}">
    <header class="engine-head" data-id="${esc(le.id)}">
      <h3>${esc(le.title)}</h3>
      <span class="engine-for">for ${chip(entity) || esc(le.attributes.entity)}</span>
    </header>
    <ol class="journey" style="--steps:${steps.length}">
      <li class="station state now" data-id="${esc(le.id)}"><span class="state-label">Today</span><p>${esc(le.attributes.current ?? "Where does the entity stand today?")}</p></li>
      ${steps
        .map(
          (s, i) => `<li class="station step${s.missing ? " broken" : ""}" data-id="${esc(s.id)}">
        <span class="step-n">${i + 1}</span>
        <strong>${esc(s.title)}</strong>
        ${s.prose ? `<p>${esc(firstSentence(s.prose, 110))}</p>` : ""}
        ${s.attributes.channel && ctx.byId.get(s.attributes.channel) ? `<span class="pill small">${esc(ctx.byId.get(s.attributes.channel).title)}</span>` : ""}
      </li>`,
        )
        .join("")}
      <li class="station state next" data-id="${esc(le.id)}"><span class="state-label">Tomorrow</span><p>${esc(le.attributes.desired ?? "Where does it want to be?")}</p></li>
    </ol>
  </div>`;
}

function serviceCard(ctx, s) {
  const users = list(s.attributes.for).map((id) => chip(ctx.byId.get(id))).join("");
  return `<article class="service ${esc(s.attributes.kind ?? "")}" data-id="${esc(s.id)}" style="--tilt:${tilt(s.id)}deg">
    <span class="service-kind">${esc(s.attributes.kind ?? "service")}</span>
    <strong>${esc(s.title)}</strong>
    ${s.prose ? `<p>${esc(firstSentence(s.prose, 100))}</p>` : ""}
    ${users ? `<div class="chips">${users}</div>` : ""}
  </article>`;
}

// ── 06 Platform experience ───────────────────────────────────────────────────

function experiences(ctx) {
  const xs = ctx.of("experience");
  const body = xs.length ? xs.map((x) => experience(ctx, x)).join("") : empty("No experiences yet.");
  return frame(ctx, "experiences", `${body}<div class="board-actions">${addButton({ type: "experience", label: "Add experience" })}${addButton({ type: "service", preset: { kind: "enabling" }, label: "Add enabling service" })}</div>`, {
    legend: flowLegend(),
  });
}

function experience(ctx, x) {
  const entities = list(x.attributes.entities).map((id) => ctx.byId.get(id)).filter(Boolean);
  const txs = list(x.attributes.transactions).map((id) => ctx.byId.get(id)).filter((t) => t?.type === "transaction");
  const services = list(x.attributes.services).map((id) => ctx.byId.get(id)).filter((s) => s?.type === "service");
  const channelIds = new Set([...txs, ...services].map((e) => e.attributes.channel).filter(Boolean));
  const channels = [...channelIds].map((id) => ctx.byId.get(id)).filter(Boolean);
  const tx = (t) => {
    const flow = t.attributes.flow ?? "information";
    return `<li class="tx-item flow-${esc(flow)} ${t.attributes.status === "potential" ? "potential" : "existing"}" data-id="${esc(t.id)}">
      <span class="tx-ends">${chip(ctx.byId.get(t.attributes.from))}<span class="tx-arrow" aria-hidden="true"></span>${chip(ctx.byId.get(t.attributes.to))}</span>
      <strong>${esc(t.title)}</strong>
    </li>`;
  };
  const svc = (kind) => services.filter((s) => s.attributes.kind === kind).map((s) => serviceCard(ctx, s)).join("") || empty("—");

  return `<div class="experience" data-experience="${esc(x.id)}">
    <div class="xp-meaning" data-id="${esc(x.id)}" style="grid-area:meaning">
      <span class="zone-label"><span class="zone-n">1</span><span>Meaning</span></span>
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.attributes.meaning ?? firstSentence(x.prose, 200))}</p>
    </div>
    ${zone(2, "Entities involved", "", entities.map((e) => entitySticky(e, { size: "small" })).join(""), { area: "entities" })}
    <div class="zone xp-core" style="grid-area:core">
      <div class="zone-label"><span class="zone-n">3</span><span>Core value unit &amp; transactions</span></div>
      <div class="core-value" data-id="${esc(x.id)}">${esc(x.attributes["core-value"] ?? ctx.platform?.attributes["core-value"] ?? "What unit of value is created?")}</div>
      <ol class="tx-list">${txs.map(tx).join("")}</ol>
    </div>
    ${zone(4, "Enabling services", "Make the transactions easier", svc("enabling"), { area: "enabling" })}
    ${zone(5, "Empowering services", "Help the entities grow", svc("empowering"), { area: "empowering" })}
    ${zone(6, "Channels", "", channels.map((c) => `<span class="pill medium-${esc(c.attributes.medium ?? "digital")}" data-id="${esc(c.id)}">${esc(c.title)}</span>`).join("") || empty("—"), { area: "channels", cls: "zone-wide" })}
  </div>`;
}

// ── 07 MVP canvas ────────────────────────────────────────────────────────────

function mvp(ctx) {
  const mvps = ctx.of("mvp");
  const body = mvps.length ? mvps.map((m) => mvpCard(ctx, m)).join("") : empty("No MVP yet. Which experience do you test first?");
  return frame(ctx, "mvp", `${body}<div class="board-actions">${addButton({ type: "mvp", preset: { status: "planned" }, label: "Add MVP" })}</div>`);
}

function mvpCard(ctx, m) {
  const x = ctx.byId.get(m.attributes.experience);
  const field = (n, key, label, hint) =>
    zone(n, label, hint, list(m.attributes[key]).map((t) => noteSticky(t, { id: m.id, field: key, cls: `tone-${key}`, key: m.id + t })).join(""), {
      area: key,
      add: { preset: { id: m.id }, field: key, label: "Add" },
    });
  const status = m.attributes.status ?? "planned";
  return `<div class="mvp">
    <div class="mvp-head" style="grid-area:head" data-id="${esc(m.id)}">
      <span class="status status-${esc(status)}">${esc(status)}</span>
      <h3>${esc(m.title)}</h3>
      <p>${esc(firstSentence(m.prose, 220))}</p>
      ${x ? `<span class="mvp-tests">tests <span class="chip role-none" data-id="${esc(x.id)}">${esc(x.title)}</span></span>` : ""}
    </div>
    ${field(1, "hypotheses", "Hypotheses", "What must be true?")}
    ${field(2, "experiments", "Experiments", "What will you do?")}
    ${field(3, "metrics", "Metrics", "What will you measure?")}
    ${field(4, "criteria", "Success criteria", "When do you call it a success?")}
  </div>`;
}
