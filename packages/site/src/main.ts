import { CANVASES, PHASES, STEPS } from "@pdt42/core";
import session from "../../../demo/cli-session.json";
import "./styles.css";

// The static page is written in index.html; this adds the theme toggle, the copy button,
// full-size links for the screenshots, the method map — generated from @pdt42/core, so it
// always matches what `pdt42 guide` teaches — and the replay of the recorded CLI session.

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

/** An entry of demo/cli-session.json (see packages/cli/tests/session.ts). */
type SessionEntry =
  | { kind: "human"; text: string }
  | { kind: "agent"; text: string }
  | { kind: "run"; command: string; output: string }
  | { kind: "write"; file: string; excerpt: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Replays the session into `screen`; calling the result again restarts it. */
function sessionPlayer(screen: HTMLElement, entries: SessionEntry[], animate: boolean) {
  let generation = 0;
  return async function play() {
    const id = ++generation;
    const alive = () => id === generation;
    screen.replaceChildren();
    // Follow the output, unless the reader scrolled up to look at something.
    const append = (node: HTMLElement) => {
      const atEnd = screen.scrollHeight - screen.scrollTop - screen.clientHeight < 48;
      screen.append(node);
      if (atEnd) screen.scrollTop = screen.scrollHeight;
      return node;
    };
    const type = async (node: HTMLElement, text: string, ms: number) => {
      if (!animate) return void (node.textContent = text);
      for (let i = 1; i <= text.length && alive(); i++) {
        node.textContent = text.slice(0, i);
        await sleep(ms);
      }
    };
    const lines = async (pre: HTMLElement, text: string, ms: number) => {
      if (!animate) return void (pre.textContent = text);
      for (const line of text.split("\n")) {
        if (!alive()) return;
        pre.textContent += `${pre.textContent ? "\n" : ""}${line}`;
        screen.scrollTop = screen.scrollHeight;
        await sleep(ms);
      }
    };

    for (const entry of entries) {
      if (!alive()) return;
      if (entry.kind === "human" || entry.kind === "agent") {
        const text = el("span");
        append(
          el(
            "p",
            { class: `session__${entry.kind}` },
            el("span", { class: "session__who" }, entry.kind === "human" ? "you" : "agent"),
            text,
          ),
        );
        await type(text, entry.text, entry.kind === "human" ? 22 : 12);
      } else if (entry.kind === "run") {
        const command = el("span");
        append(
          el(
            "div",
            { class: "session__cmd" },
            el("span", { class: "session__prompt" }, "$ "),
            command,
          ),
        );
        await type(command, entry.command, 55);
        if (animate) await sleep(350);
        await lines(append(el("pre", { class: "session__out" })), entry.output, 30);
      } else {
        append(el("div", { class: "session__write" }, `✎ ${entry.file}`));
        await lines(append(el("pre", { class: "session__file" })), entry.excerpt, 45);
      }
      if (animate) await sleep(entry.kind === "run" ? 1400 : 700);
    }
  };
}

function startSession() {
  const screen = document.getElementById("session-screen");
  if (!screen) return;
  const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const play = sessionPlayer(screen, session as SessionEntry[], animate);
  document.getElementById("session-replay")?.addEventListener("click", () => void play());
  if (!animate || !("IntersectionObserver" in window)) return void play();
  // Start once the terminal is on screen, so the reader sees it from the first command.
  const observer = new IntersectionObserver(
    (seen) => {
      if (!seen.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      void play();
    },
    { threshold: 0.4 },
  );
  observer.observe(screen);
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
  startSession();
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
