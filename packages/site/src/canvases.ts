import {
  CANVASES,
  PHASES,
  parseWorkspace,
  titleOf,
  type CanvasInfo,
  type Element,
} from "@pdt42/core";
import { EXAMPLES } from "./canvas-examples.ts";
import { initTheme } from "./theme.ts";
import "./styles.css";

// The canvas translation page: every PDT canvas as Boundaryless publishes it, next to the canvas
// pdt42 draws for Harvest Commons, with the model fields that fill each area. Generated from
// @pdt42/core and the example itself, so it always matches what `pdt42 guide canvas` says.

const EXAMPLE = "../harvest-commons/";

const sources = import.meta.glob<string>("../../../examples/harvest-commons/**/*.pdt42.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const files = Object.entries(sources).map(([path, content]) => ({
  file: path.replace(/^.*\/harvest-commons\//, ""),
  content,
}));
const workspace = parseWorkspace(files);
const lines = new Map(files.map((f) => [f.file, f.content.split("\n")]));

const byName = (glob: Record<string, string>) =>
  new Map(Object.entries(glob).map(([path, url]) => [path.replace(/^.*\/|\.\w+$/g, ""), url]));
const originals = byName(
  import.meta.glob<string>("../canvases/originals/*.webp", {
    query: "?url",
    import: "default",
    eager: true,
  }),
);
const renderings = byName(
  import.meta.glob<string>("../../../demo/canvases/*.png", {
    query: "?url",
    import: "default",
    eager: true,
  }),
);

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

/** Source lines `from`…`to` (1-based, inclusive) of a file, in a pdt42 fence. */
function block(file: string, from: number, to: number): string {
  const source = lines.get(file) ?? [];
  return ["```pdt42", ...source.slice(from - 1, to), "```"].join("\n");
}

/** The source of an element's block: from its `:::type` line to the closing `:::`. */
function elementBlock(element: Element): string {
  const source = lines.get(element.loc.file) ?? [];
  const close = source.findIndex(
    (line, index) => index >= element.loc.line && line.trim() === ":::",
  );
  return block(element.loc.file, element.loc.line, close < 0 ? source.length : close + 1);
}

function canvasBlock(viewId: string): { source: string; href: string } | undefined {
  const view = workspace.canvases.find((v) => v.id === viewId);
  if (!view) return undefined;
  const source = lines.get(view.loc.file) ?? [];
  const end = source.findIndex((line, i) => i >= view.loc.line && line.trim() === ":::");
  return {
    source: block(view.loc.file, view.loc.line, end + 1),
    href: `${EXAMPLE}#${view.loc.file}:${view.id}`,
  };
}

function figure(src: string | undefined, alt: string, href: string, caption: (Node | string)[]) {
  const body = src
    ? el(
        "a",
        { class: "cmp__zoom", href, title: "Open full size" },
        el("img", { src, alt, loading: "lazy" }),
      )
    : el("div", { class: "cmp__none" }, alt);
  return el("figure", { class: "cmp__figure" }, body, el("figcaption", {}, ...caption));
}

function section(canvas: CanvasInfo): HTMLElement {
  const example = EXAMPLES[canvas.id];
  const placed = example?.view ? canvasBlock(example.view) : undefined;
  const element = example ? workspace.byId.get(example.element) : undefined;
  const original = originals.get(canvas.id);
  const rendering = example?.view ? renderings.get(example.view) : undefined;

  const pair = el(
    "div",
    { class: "cmp__pair" },
    figure(
      original,
      original
        ? `${canvas.title}, the original PDT 2.2 canvas`
        : `The Boundaryless page has no ${canvas.title} image: it is a ${canvas.kind}.`,
      original ?? canvas.source,
      [
        el("strong", {}, "PDT 2.2 original"),
        " · © Boundaryless SRL, ",
        el("a", { href: "https://creativecommons.org/licenses/by-sa/4.0/" }, "CC BY-SA 4.0"),
        original ? ", resized" : "",
      ],
    ),
    figure(
      rendering,
      rendering
        ? `${canvas.title} as pdt42 draws it for Harvest Commons`
        : "Not placed in Harvest Commons: pdt42 draws it from the fields below.",
      rendering ?? EXAMPLE,
      [
        el("strong", {}, "pdt42"),
        " · drawn from Harvest Commons",
        ...(placed ? [" · ", el("a", { href: placed.href }, "open live →")] : []),
      ],
    ),
  );

  const table = el(
    "table",
    { class: "cmp__table" },
    el("thead", {}, el("tr", {}, el("th", {}, "On the canvas"), el("th", {}, "In pdt42"))),
    el(
      "tbody",
      {},
      ...canvas.areas.map((area) =>
        el(
          "tr",
          {},
          el("td", {}, area.title),
          el("td", {}, ...area.fills.flatMap((f, i) => [...(i ? [" "] : []), el("code", {}, f)])),
        ),
      ),
    ),
  );

  const how = el(
    "div",
    { class: "cmp__source" },
    el("h4", {}, "Place it in the chapter"),
    el(
      "pre",
      {},
      placed?.source ??
        [
          "```pdt42",
          ":::canvas",
          `id: cv-${canvas.id}`,
          `canvas: ${canvas.id}`,
          ...(canvas.per ? [`of: <${canvas.per} id>`] : []),
          ":::",
          "```",
        ].join("\n"),
    ),
    ...(element
      ? [
          el("h4", {}, `One element on it: ${titleOf(element)}`),
          el("pre", {}, elementBlock(element)),
        ]
      : []),
  );

  return el(
    "section",
    { class: "cmp", id: canvas.id },
    el(
      "header",
      { class: "cmp__header" },
      el("span", { class: "cmp__steps" }, canvas.steps.join(" · ")),
      el("h2", { class: "cmp__title" }, canvas.title),
      el("a", { class: "cmp__link", href: canvas.source }, "Boundaryless guide ↗"),
    ),
    pair,
    el("div", { class: "cmp__map" }, table, how),
  );
}

function start() {
  initTheme();
  const toc = document.getElementById("canvas-toc");
  const list = document.getElementById("canvas-list");
  for (const phase of PHASES) {
    const canvases = CANVASES.filter((c) => c.phase === phase.id);
    toc?.append(
      el(
        "div",
        { class: `cmp-toc__phase method__phase--${phase.id}` },
        el("h3", {}, phase.title),
        el("ul", {}, ...canvases.map((c) => el("li", {}, el("a", { href: `#${c.id}` }, c.title)))),
      ),
    );
    list?.append(
      el("h2", { class: `cmp-phase method__phase--${phase.id}` }, phase.title),
      ...canvases.map(section),
    );
  }
  // Rendered after load, so jump to the canvas in the address now that it exists.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

start();
