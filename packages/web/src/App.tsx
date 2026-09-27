import type { WorkspacePayload } from "@pdt42/core";
import { h, mount } from "./dom.ts";
import type { Ctx, ViewState } from "./context.ts";
import { DocumentView } from "./DocumentView.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { WorkspaceIndex } from "./workspace.ts";

// ─── Hash routing ────────────────────────────────────────────────────────────
//
//   #2-design/d5-transactions.pdt42.md                     chapter
//   #2-design/d5-transactions.pdt42.md:el-t-share-menus    chapter + element (model box opens)
//   #2-design/d5-transactions.pdt42.md:cv-board-restaurant chapter + canvas or heading
//
// File names contain no colons, so the first colon separates file and anchor.

export function parseHash(hash: string): { file: string; anchor: string | null } {
  const fragment = decodeURIComponent(hash.replace(/^#/, ""));
  const colon = fragment.indexOf(":");
  if (colon < 0) return { file: fragment, anchor: null };
  return { file: fragment.slice(0, colon), anchor: fragment.slice(colon + 1) || null };
}

function applyHash(state: ViewState, ix: WorkspaceIndex, hash: string): void {
  const { file, anchor } = parseHash(hash);
  const doc = ix.document(file) ?? ix.payload.documents[0];
  const changed = doc?.file !== state.file;
  state.file = doc?.file ?? "";
  state.sidebarOpen = false;
  if (anchor?.startsWith("el-")) state.expanded.add(anchor.slice(3));
  state.scrollTo = anchor ?? (changed ? "top" : null);
}

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme(): void {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage may be unavailable (private mode, file://): the toggle still works for the page.
  }
}

export interface App {
  /** Replace the workspace (live reload), keeping what the reader has open. */
  load(payload: WorkspacePayload): void;
}

export function startApp(root: HTMLElement, payload: WorkspacePayload): App {
  let ix = new WorkspaceIndex(payload);
  const state: ViewState = {
    file: "",
    mode: "human",
    expanded: new Set(),
    scrollTo: null,
    sidebarOpen: false,
  };
  applyHash(state, ix, location.hash);

  const render = () => {
    const ctx: Ctx = { ix, state, update };
    const y = window.scrollY;
    mount(
      root,
      <div class="layout">
        <button
          class="menu-button"
          aria-label="Open navigation"
          onClick={() => update((s) => (s.sidebarOpen = true))}
        >
          ☰ {ix.document(state.file)?.title ?? "Chapters"}
        </button>
        {state.sidebarOpen && (
          <button
            class="backdrop"
            aria-label="Close navigation"
            onClick={() => update((s) => (s.sidebarOpen = false))}
          />
        )}
        <Sidebar ctx={ctx} onTheme={toggleTheme} />
        <main class="main">
          <DocumentView ctx={ctx} />
        </main>
      </div>,
    );
    const target = state.scrollTo;
    state.scrollTo = null;
    if (target === "top") window.scrollTo(0, 0);
    else if (target) {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ block: "start" });
        el.classList.add("flash");
      }
    } else window.scrollTo(0, y);
  };

  function update(change: (s: ViewState) => void) {
    change(state);
    render();
  }

  window.addEventListener("hashchange", () => update((s) => applyHash(s, ix, location.hash)));
  render();

  return {
    load(next) {
      ix = new WorkspaceIndex(next);
      if (!ix.document(state.file)) state.file = next.documents[0]?.file ?? "";
      render();
    },
  };
}
