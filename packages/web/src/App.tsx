import type { WorkspacePayload } from "@pdt42/core";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
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

export function applyHash(state: ViewState, ix: WorkspaceIndex, hash: string): void {
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

function initialState(ix: WorkspaceIndex): ViewState {
  const state: ViewState = {
    file: "",
    mode: "human",
    expanded: new Set(),
    scrollTo: null,
    sidebarOpen: false,
  };
  applyHash(state, ix, location.hash);
  return state;
}

async function fetchWorkspace(): Promise<WorkspacePayload> {
  const res = await fetch("./api/workspace", { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as WorkspacePayload;
}

/**
 * The workspace in the browser. `live`: reload the workspace whenever `pdt42 serve` announces a
 * change (not for a static build, whose workspace is injected into the page).
 */
export function App({ initial, live }: { initial: WorkspacePayload; live: boolean }) {
  const [payload, setPayload] = useState(initial);
  const ix = useMemo(() => new WorkspaceIndex(payload), [payload]);
  const [state, setState] = useState(() => initialState(ix));

  const update = useCallback((change: (s: ViewState) => void) => {
    setState((prev) => {
      const next = { ...prev, expanded: new Set(prev.expanded) };
      change(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onHashChange = () => update((s) => applyHash(s, ix, location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [ix, update]);

  useEffect(() => {
    if (!live || !("EventSource" in window)) return;
    const events = new EventSource("./api/workspace/events");
    events.addEventListener("workspace", () => {
      fetchWorkspace().then(setPayload, (error: unknown) => console.error(error));
    });
    return () => events.close();
  }, [live]);

  // A chapter that disappeared on reload falls back to the first one.
  useEffect(() => {
    if (!ix.document(state.file)) update((s) => (s.file = ix.payload.documents[0]?.file ?? ""));
  }, [ix, state.file, update]);

  // Scroll to the anchor the last navigation asked for, once it is rendered.
  useLayoutEffect(() => {
    const target = state.scrollTo;
    if (!target) return;
    state.scrollTo = null; // consumed; not a render-relevant change
    if (target === "top") window.scrollTo(0, 0);
    else {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ block: "start" });
        el.classList.add("flash");
      }
    }
  }, [state]);

  const ctx: Ctx = { ix, state, update };
  return (
    <div className="layout">
      <button
        className="menu-button"
        aria-label="Open navigation"
        onClick={() => update((s) => (s.sidebarOpen = true))}
      >
        ☰ {ix.document(state.file)?.title ?? "Chapters"}
      </button>
      {state.sidebarOpen && (
        <button
          className="backdrop"
          aria-label="Close navigation"
          onClick={() => update((s) => (s.sidebarOpen = false))}
        />
      )}
      <Sidebar ctx={ctx} onTheme={toggleTheme} />
      <main className="main">
        <DocumentView ctx={ctx} />
      </main>
    </div>
  );
}

export { fetchWorkspace };
