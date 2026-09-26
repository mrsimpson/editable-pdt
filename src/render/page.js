import { CANVASES } from "../core/schema.js";
import { renderCanvas } from "./canvases.js";
import { esc } from "./markdown.js";

// The complete page around the canvases: top bar, hero, every canvas and
// the model-health panel. Used by `pdt build` (static, read-only) and as the
// first paint of `pdt serve` (the editor script takes over from there).

export function renderMain(model, diagnostics) {
  const platform = model.elements.find((e) => e.type === "platform");
  const count = (type) => model.elements.filter((e) => e.type === type).length;
  const stats = [
    ["entity", "Entities"],
    ["transaction", "Transactions"],
    ["experience", "Experiences"],
  ];
  const hero = `<section class="hero">
    <div${platform ? ` data-id="${esc(platform.id)}"` : ""}>
      <h1>${esc(platform?.title ?? "Untitled platform")}</h1>
      <p>${esc(platform?.attributes.purpose ?? "Add a :::platform block to name the platform and its purpose.")}</p>
      ${platform?.attributes["core-value"] ? `<span class="core-value-tag">Core value unit <b>${esc(platform.attributes["core-value"])}</b></span>` : ""}
    </div>
    <div class="stats">${stats.map(([t, l]) => `<div><b>${count(t)}</b><span>${l}</span></div>`).join("")}</div>
  </section>`;
  return `${hero}${CANVASES.map((c) => renderCanvas(model, c.id)).join("\n")}${renderHealth(diagnostics)}`;
}

export function renderHealth(diagnostics) {
  const items = diagnostics.length
    ? `<ul class="diagnostics">${diagnostics
        .map(
          (d) => `<li class="${d.severity}"${d.element ? ` data-id="${esc(d.element)}"` : ""}><code>${esc(d.code)}</code><span>${esc(d.message)}</span><small>${esc(d.file)}:${d.line}</small></li>`,
        )
        .join("")}</ul>`
    : `<p class="empty">The model is consistent. No findings.</p>`;
  return `<section class="canvas panel-health" data-canvas="health">
    <header class="canvas-head"><div class="canvas-kicker"><span class="canvas-no">✓</span>Validation</div><h2 class="canvas-title">Model health</h2>
    <p class="canvas-question">Where does the design contradict itself, and where are the gaps?</p></header>${items}</section>`;
}

export function healthSummary(diagnostics) {
  const n = (s) => diagnostics.filter((d) => d.severity === s).length;
  const parts = [["error", n("error")], ["warning", n("warning")], ["hint", n("hint")]].filter(([, c]) => c > 0);
  if (!parts.length) return `<span class="dot ok"></span>Consistent`;
  return parts.map(([s, c]) => `<span class="dot ${s}"></span>${c}`).join(" ");
}

export function renderPage(model, diagnostics, { editable = false, css = "", cssHref = "", script = "" } = {}) {
  const platform = model.elements.find((e) => e.type === "platform");
  const tabs = [
    ...CANVASES.map((c, i) => `<a href="#${c.id}" data-tab="${c.id}"><small>${String(i + 1).padStart(2, "0")}</small>${esc(c.short)}</a>`),
    `<a href="#all" data-tab="all">All</a>`,
  ].join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(platform?.title ?? "Platform")} · Platform Design</title>
${cssHref ? `<link rel="stylesheet" href="${esc(cssHref)}">` : `<style>${css}</style>`}
</head>
<body class="${editable ? "editable" : "readonly"}">
<header class="topbar">
  <span class="brand"><span class="brand-mark"></span>editable pdt</span>
  <nav class="tabs">${tabs}</nav>
  <button class="health" type="button" data-tab="health" title="Model health">${healthSummary(diagnostics)}</button>
  <button class="theme-toggle" type="button" title="Toggle light and dark">◐</button>
</header>
<main id="main">${renderMain(model, diagnostics)}</main>
<script>${TAB_SCRIPT}</script>
${script}
</body>
</html>`;
}

// Classic script so the static build also works when opened from disk.
export const TAB_SCRIPT = `
(function () {
  function show() {
    var tab = (location.hash || "#ecosystem").slice(1);
    document.querySelectorAll("[data-canvas]").forEach(function (s) {
      s.style.display = tab === "all" ? (s.dataset.canvas === "health" ? "none" : "") : (s.dataset.canvas === tab ? "" : "none");
    });
    document.querySelectorAll(".hero").forEach(function (h) { h.style.display = tab === "all" || tab === "ecosystem" ? "" : "none"; });
    document.querySelectorAll("[data-tab]").forEach(function (a) { a.classList.toggle("active", a.dataset.tab === tab); });
  }
  window.pdtShowTab = show;
  addEventListener("hashchange", show);
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".health"); if (b) { location.hash = "health"; }
    var t = e.target.closest(".theme-toggle");
    if (t) {
      var root = document.documentElement;
      var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("pdt-theme", root.dataset.theme); } catch (_) {}
    }
  });
  try { var saved = localStorage.getItem("pdt-theme"); if (saved) document.documentElement.dataset.theme = saved; } catch (_) {}
  show();
})();`;
