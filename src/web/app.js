import { BLOCK_TYPES, ROLES } from "../core/schema.js";
import { renderMain, healthSummary } from "../render/page.js";
import { esc } from "../render/markdown.js";

// The editor behind `pdt serve`. Canvases are re-rendered from the same
// renderers the static build uses; every save goes through the API, which
// rewrites only the affected block in its .pdt.md file.

let model = { elements: [] };
let diagnostics = [];
let open = null; // { mode: "edit" | "new", type, id }

const main = document.getElementById("main");
const editor = document.createElement("aside");
editor.className = "editor";
editor.hidden = true;
document.body.append(editor);

const toast = document.createElement("div");
toast.className = "toast";
document.body.append(toast);

async function refresh(data) {
  if (!data) data = await (await fetch("/api/model")).json();
  model = data.model;
  diagnostics = data.diagnostics;
  const scroll = scrollY;
  main.innerHTML = renderMain(model, diagnostics);
  document.querySelector(".health").innerHTML = healthSummary(diagnostics);
  window.pdtShowTab?.();
  scrollTo(0, scroll);
  markFindings();
}

function markFindings() {
  const worst = new Map();
  for (const d of diagnostics) if (d.element && !worst.has(d.element)) worst.set(d.element, d.severity);
  for (const el of main.querySelectorAll("[data-id]")) {
    const s = worst.get(el.dataset.id);
    if (s === "error" || s === "warning") el.dataset.finding = s;
  }
}

const byId = (id) => model.elements.find((e) => e.id === id);

// ── Opening the editor ───────────────────────────────────────────────────────

document.addEventListener("click", (event) => {
  if (event.target.closest(".editor")) return;
  const add = event.target.closest(".add");
  if (add) {
    event.preventDefault();
    if (add.dataset.add) return openNew(add.dataset.add, JSON.parse(add.dataset.preset || "{}"));
    if (add.dataset.field) return openEdit(add.dataset.id, add.dataset.field, true);
  }
  const target = event.target.closest("[data-id]");
  if (target && !event.target.closest("a[href]")) {
    const element = byId(target.dataset.id);
    if (element) openEdit(element.id, target.dataset.field);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editor.hidden) close();
  if ((e.metaKey || e.ctrlKey) && e.key === "s" && !editor.hidden) {
    e.preventDefault();
    save();
  }
});

function openEdit(id, focusField, appendItem = false) {
  const element = byId(id);
  if (!element) return;
  open = { mode: "edit", type: element.type, id };
  render(element.type, element.attributes, element.prose, element);
  focus(focusField, appendItem);
}

function openNew(type, preset) {
  open = { mode: "new", type };
  render(type, { ...preset }, "", null);
  focus("title");
}

function focus(field, appendItem) {
  const input = field && editor.querySelector(`[name="${CSS.escape(field)}"]`);
  const target = input ?? editor.querySelector("input, textarea, select");
  if (!target) return;
  if (appendItem && target.tagName === "TEXTAREA") {
    target.value = target.value.trimEnd() + (target.value.trim() ? "\n" : "");
  }
  target.focus();
  if (target.setSelectionRange && target.value !== undefined) target.setSelectionRange(target.value.length, target.value.length);
}

function close() {
  editor.hidden = true;
  open = null;
  document.body.classList.remove("editing");
}

// ── Form ─────────────────────────────────────────────────────────────────────

function render(type, attributes, prose, element) {
  const schema = BLOCK_TYPES[type];
  const findings = element ? diagnostics.filter((d) => d.element === element.id) : [];
  const fields = Object.entries(schema.attributes)
    .filter(([key]) => !(key === "id" && !element))
    .map(([key, def]) => field(key, def, attributes[key]))
    .join("");
  editor.innerHTML = `
    <form class="editor-form" autocomplete="off">
      <header class="editor-head">
        <span class="editor-type">${esc(schema.label)}</span>
        <h2>${esc(element ? element.title : `New ${schema.label.toLowerCase()}`)}</h2>
        <p>${esc(schema.summary)}</p>
        ${element ? `<code class="editor-src">${esc(element.file)}:${element.line}</code>` : ""}
        <button type="button" class="editor-close" aria-label="Close">×</button>
      </header>
      ${findings.length ? `<ul class="diagnostics">${findings.map((d) => `<li class="${d.severity}"><code>${d.code}</code><span>${esc(d.message)}</span></li>`).join("")}</ul>` : ""}
      <div class="editor-fields">${fields}
        <label class="field"><span class="field-label">Prose <small>Markdown — why this element exists</small></span>
          <textarea name="__prose" rows="6">${esc(prose)}</textarea></label>
      </div>
      <footer class="editor-foot">
        ${element ? `<button type="button" class="btn danger" data-action="delete">Delete</button>` : ""}
        <span class="spacer"></span>
        <button type="button" class="btn" data-action="cancel">Cancel</button>
        <button type="submit" class="btn primary">${element ? "Save" : "Create"} <kbd>⌘S</kbd></button>
      </footer>
    </form>`;
  editor.hidden = false;
  document.body.classList.add("editing");
  const form = editor.querySelector("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });
  editor.querySelector(".editor-close").onclick = close;
  editor.querySelector('[data-action="cancel"]').onclick = close;
  editor.querySelector('[data-action="delete"]')?.addEventListener("click", remove);
}

function field(key, def, value) {
  const label = `<span class="field-label">${esc(key)}${def.required ? " <b>*</b>" : ""}${def.help ? ` <small>${esc(def.help)}</small>` : ""}</span>`;
  if (def.kind === "enum") {
    const options = def.values
      .map((v) => {
        const text = key === "role" ? ROLES.find((r) => r.id === v)?.short ?? v : v;
        return `<label class="seg ${key === "role" ? `role-${v}` : ""}"><input type="radio" name="${esc(key)}" value="${esc(v)}"${v === value ? " checked" : ""}><span>${esc(text)}</span></label>`;
      })
      .join("");
    return `<fieldset class="field">${label}<div class="segments">${options}</div></fieldset>`;
  }
  if (def.kind === "ref") {
    const options = model.elements.filter((e) => e.type === def.to);
    return `<label class="field">${label}<select name="${esc(key)}"><option value="">—</option>${options
      .map((o) => `<option value="${esc(o.id)}"${o.id === value ? " selected" : ""}>${esc(o.title)} (${esc(o.id)})</option>`)
      .join("")}</select></label>`;
  }
  if (def.kind === "refs") {
    const selected = Array.isArray(value) ? value : [];
    const candidates = model.elements.filter((e) => e.type === def.to);
    const ordered = [...selected.map(byId).filter(Boolean), ...candidates.filter((c) => !selected.includes(c.id))];
    return `<fieldset class="field">${label}<div class="checks" data-refs="${esc(key)}">${ordered
      .map(
        (o) => `<label class="check ${o.type === "entity" ? `role-${o.attributes.role}` : ""}"><input type="checkbox" name="${esc(key)}" value="${esc(o.id)}"${selected.includes(o.id) ? " checked" : ""}><span>${esc(o.title)}</span></label>`,
      )
      .join("") || `<span class="empty">No ${esc(def.to)} elements yet</span>`}</div></fieldset>`;
  }
  if (def.kind === "list") {
    const text = (Array.isArray(value) ? value : value ? [value] : []).join("\n");
    return `<label class="field">${label}<textarea name="${esc(key)}" rows="${Math.max(3, text.split("\n").length + 1)}" placeholder="One sticky per line">${esc(text)}</textarea></label>`;
  }
  return `<label class="field">${label}<input name="${esc(key)}" value="${esc(value ?? "")}"${key === "id" ? ' pattern="[a-z0-9][a-z0-9\\-]*" spellcheck="false"' : ""}></label>`;
}

function collect() {
  const schema = BLOCK_TYPES[open.type];
  const form = editor.querySelector("form");
  const attributes = {};
  for (const [key, def] of Object.entries(schema.attributes)) {
    if (def.kind === "refs") attributes[key] = [...form.querySelectorAll(`input[name="${CSS.escape(key)}"]:checked`)].map((i) => i.value);
    else if (def.kind === "enum") attributes[key] = form.querySelector(`input[name="${CSS.escape(key)}"]:checked`)?.value ?? "";
    else {
      const input = form.elements.namedItem(key);
      if (!input) continue;
      attributes[key] = def.kind === "list" ? input.value.split("\n").map((s) => s.trim()).filter(Boolean) : input.value.trim();
    }
  }
  return { attributes, prose: form.elements.namedItem("__prose").value };
}

async function save() {
  if (!open) return;
  const payload = collect();
  const request =
    open.mode === "new"
      ? fetch("/api/elements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: open.type, ...payload }) })
      : fetch(`/api/elements/${encodeURIComponent(open.id)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const response = await request;
  const data = await response.json();
  if (!response.ok) return notify(data.error ?? "Could not save", true);
  await refresh(data);
  notify(open.mode === "new" ? `Created ${data.id}` : `Saved ${data.id}`);
  close();
}

async function remove() {
  if (!open || open.mode !== "edit") return;
  if (!confirm(`Delete ${open.id}? This removes its section from the Markdown file.`)) return;
  const response = await fetch(`/api/elements/${encodeURIComponent(open.id)}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) return notify(data.error ?? "Could not delete", true);
  await refresh(data);
  notify(`Deleted ${open.id}`);
  close();
}

function notify(message, error = false) {
  toast.textContent = message;
  toast.className = `toast show${error ? " error" : ""}`;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => (toast.className = "toast"), 2600);
}

// Files changed on disk (editor, agent, git checkout): reload the model.
const events = new EventSource("/api/events");
events.onmessage = () => refresh();

refresh();
