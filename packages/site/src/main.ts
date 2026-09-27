import { CANVASES, PHASES, STEPS } from "@pdt42/core";
import "./styles.css";

// The static page is written in index.html; this adds the theme toggle, the copy button,
// full-size links for the screenshots, and the method map — generated from @pdt42/core, so it
// always matches what `pdt42 guide` teaches.

const EXAMPLE = "./harvest-commons/";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

function methodMap(): HTMLElement {
  const map = el("div", { class: "method__grid" });
  for (const phase of PHASES) {
    const steps = el("ol", { class: "method__steps" });
    for (const step of STEPS.filter((s) => s.phase === phase.id)) {
      const canvas = CANVASES.find((c) => c.id === step.canvas);
      steps.append(
        el(
          "li",
          {},
          el(
            "a",
            { href: `${EXAMPLE}#${step.file}`, title: step.question },
            el("span", { class: "method__id" }, step.id),
            el("span", { class: "method__title" }, step.title),
            el("span", { class: "method__canvas" }, canvas ? canvas.title : "no canvas of its own"),
          ),
        ),
      );
    }
    map.append(
      el(
        "section",
        { class: `method__phase method__phase--${phase.id}` },
        el("h3", { class: "method__name" }, phase.title),
        el("p", { class: "method__question" }, phase.question),
        steps,
      ),
    );
  }
  return map;
}

function toggleTheme() {
  const root = document.documentElement;
  const current =
    root.getAttribute("data-theme") ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage unavailable: the theme still changes for this visit.
  }
}

function start() {
  document.getElementById("method-map")?.append(methodMap());
  document.getElementById("theme")?.addEventListener("click", toggleTheme);

  const copy = document.getElementById("copy");
  copy?.addEventListener("click", () => {
    const text = document.getElementById("start-cmd")?.textContent ?? "";
    navigator.clipboard?.writeText(text).then(
      () => {
        copy.textContent = "✓";
        setTimeout(() => (copy.textContent = "⧉"), 1500);
      },
      () => undefined,
    );
  });

  // Screenshots open full size: the bundler rewrites the image URLs, so take them from there.
  for (const link of document.querySelectorAll<HTMLAnchorElement>(".row__zoom")) {
    const img = link.querySelector("img");
    if (img) link.href = img.src;
  }
}

start();
