import { loadWorkspaceFromFiles, type DiffPayload, type WorkspacePayload } from "@pdt42/core";
import type { DiffDocument } from "@cli42/lib/diff";
import {
  changesHref,
  historyHref,
  openVersion,
  parseRoute,
  pearlKey,
  versionHref,
} from "@cli42/lib/web";
import type { HistorySource, Route, SnapshotFiles } from "@cli42/lib/web";
import {
  ChangesView,
  HistoryChain,
  HistoryEntryView,
  WebViewProvider,
  useHistory,
  useSnapshot,
  useTheme,
  useVersion,
} from "@cli42/lib/web-react";
import type { WebView } from "@cli42/lib/web-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { Ctx, ViewState } from "./context.ts";
import { DocumentView, NodesView, isElementBlock } from "./DocumentView.tsx";
import { MetaModelView } from "./MetaModelView.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { WorkspaceIndex } from "./workspace.ts";

// ─── Routing ─────────────────────────────────────────────────────────────────
//
// The routes of every *42 web view (@cli42/lib/web):
//
//   #2-design/d5-transactions.pdt42.md                     chapter
//   #2-design/d5-transactions.pdt42.md:el-t-share-menus    chapter + element (model box opens)
//   #2-design/d5-transactions.pdt42.md:cv-board-restaurant chapter + canvas or heading
//   #changes                                               the visualized difference
//   #history[:<commit|worktree>[:message]]                 the history, one pearl selected
//   ?version=<commit>                                      an earlier version as a whole
//   #meta-model                                            the meta-model diagram

const APP_VIEWS = ["meta-model"] as const;

export function applyRoute(state: ViewState, ix: WorkspaceIndex, route: Route): void {
  state.sidebarOpen = false;
  // app view (meta-model): set sentinel file, skip document lookup
  if (route.view === "app") {
    state.file = `__${route.name}__`;
    return;
  }
  if (route.view !== "document") return;
  const path = route.file ? ix.routes.resolve(route.file) : undefined;
  const doc = (path && ix.document(path)) || ix.payload.documents[0];
  const changed = doc?.filePath !== state.file;
  state.file = doc?.filePath ?? "";
  if (route.element) state.expanded.add(route.element);
  state.scrollTo = route.anchor ?? (changed ? "top" : null);
}

function initialState(ix: WorkspaceIndex): ViewState {
  const state: ViewState = {
    file: "",
    mode: "human",
    expanded: new Set(),
    scrollTo: null,
    sidebarOpen: false,
  };
  applyRoute(state, ix, parseRoute(location.hash, { views: APP_VIEWS }));
  return state;
}

/** Loads a diff from the server (404 = no diff configured). */
interface DiffState {
  diff: DiffPayload | null;
  error: string | null;
}

async function fetchWorkspace(): Promise<WorkspacePayload> {
  const res = await fetch("./api/workspace", { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as WorkspacePayload;
}

async function fetchDiff(): Promise<DiffState> {
  const res = await fetch("./api/diff");
  if (res.status === 404) return { diff: null, error: null };
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    return { diff: null, error: body.error ?? `HTTP ${res.status}` };
  }
  return { diff: (await res.json()) as DiffPayload, error: null };
}

/** An earlier version, built in the browser from the history's files. */
async function loadVersion({ files }: SnapshotFiles): Promise<WorkspacePayload> {
  return (await loadWorkspaceFromFiles(files)).payload;
}

function LoadError({ title, error }: { title: string; error: string }) {
  return (
    <div className="load-error">
      <h1>{title}</h1>
      <pre>{error}</pre>
    </div>
  );
}

/** Loads the workspace (and the difference and history), and the version the URL asks for. */
export function Root() {
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [diffState, setDiffState] = useState<DiffState>({ diff: null, error: null });
  const [history, setHistory] = useState<HistorySource | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const version = useVersion();
  const snapshot = useSnapshot(
    payload ? history : undefined,
    version,
    loadVersion,
    "This site has no history.",
  );

  useEffect(() => {
    const injected = window.__WORKSPACE__;
    if (injected) {
      setPayload(injected);
      setDiffState({ diff: window.__DIFF__ ?? null, error: null });
      setHistory(window.__HISTORY__ ?? null);
      return;
    }
    // pdt42 serve: always offers the history; its index answers why when there is none.
    setHistory({ base: "./api/history/" });
    let active = true;
    let events: EventSource | undefined;
    Promise.all([fetchWorkspace(), fetchDiff()])
      .then(([workspace, diff]) => {
        if (!active) return;
        setPayload(workspace);
        setDiffState(diff);
        if (!("EventSource" in window)) return;
        events = new EventSource("./api/workspace/events");
        events.addEventListener("workspace", () => {
          setRefresh((n) => n + 1);
          fetchWorkspace().then(setPayload, (e: unknown) => setError(String(e)));
          fetchDiff().then(setDiffState, (e: unknown) =>
            setDiffState({ diff: null, error: String(e) }),
          );
        });
      })
      .catch((e: unknown) => setError(String(e)));
    return () => {
      active = false;
      events?.close();
    };
  }, []);

  if (error) return <LoadError title="Could not load the workspace" error={error} />;
  if (!payload) return <div className="empty">Loading…</div>;
  if (version) {
    if (snapshot.status === "error") {
      return (
        <div className="load-error" data-testid="version-error">
          <h1>Could not load version {version.slice(0, 8)}</h1>
          <pre>{snapshot.reason}</pre>
          <a href={versionHref(null)}>Back to the current version</a>
        </div>
      );
    }
    if (snapshot.status === "loading") {
      return <div className="empty">Loading version {version.slice(0, 8)}…</div>;
    }
    // The difference belongs to the current version, so it is not shown here.
    return (
      <App
        key={version}
        initial={snapshot.payload}
        diff={null}
        diffError={null}
        history={history}
        refresh={refresh}
        version={version}
      />
    );
  }
  return (
    <App
      key="current"
      initial={payload}
      diff={diffState.diff}
      diffError={diffState.error}
      history={history}
      refresh={refresh}
      version={null}
    />
  );
}

interface AppProps {
  initial: WorkspacePayload;
  diff: DiffPayload | null;
  diffError: string | null;
  history: HistorySource | null;
  refresh: number;
  /** The commit of the earlier version shown, if any. */
  version: string | null;
}

/** The workspace in the browser: chapters, the changes and the history. */
export function App({ initial, diff, diffError, history, refresh, version }: AppProps) {
  const ix = useMemo(() => new WorkspaceIndex(initial), [initial]);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash, { views: APP_VIEWS }));
  const [state, setState] = useState(() => initialState(ix));
  const { toggle: toggleTheme } = useTheme();

  const update = useCallback((change: (s: ViewState) => void) => {
    setState((prev) => {
      const next = { ...prev, expanded: new Set(prev.expanded) };
      change(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute(location.hash, { views: APP_VIEWS });
      setRoute(next);
      update((s) => applyRoute(s, ix, next));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [ix, update]);

  // A chapter that disappeared on reload falls back to the first one.
  // App-view sentinels (__meta-model__) are never in the workspace — skip fallback.
  useEffect(() => {
    if (state.file.startsWith("__") && state.file.endsWith("__")) return;
    if (!ix.document(state.file)) update((s) => (s.file = ix.payload.documents[0]?.filePath ?? ""));
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

  // The changes: #changes, and the landing page whenever a difference is shown.
  const hasDiff = diff !== null || diffError !== null;
  const showChanges =
    hasDiff &&
    (route.view === "changes" || (route.view === "document" && !route.file && !route.anchor));
  const diffDocuments = useMemo(
    () => new Map<string, DiffDocument>(diff?.view.documents.map((d) => [d.file, d]) ?? []),
    [diff],
  );

  // The history: #history, #history:<commit|worktree>[:message]
  const showHistory = history !== null && route.view === "history";
  const historyKey = route.view === "history" ? route.key : null;
  const historyMessage = route.view === "history" && route.message;
  const historyData = useHistory<DiffPayload>(history, refresh);
  const pearls = historyData.state.status === "ready" ? historyData.state.pearls : [];
  useEffect(() => {
    // Entering the history without a selection opens the newest pearl.
    if (showHistory && historyKey === null && pearls[0]) {
      window.history.replaceState(null, "", historyHref(pearlKey(pearls[0])));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }, [showHistory, historyKey, pearls]);
  const selectPearl = (key: string, message = false) => {
    location.hash = historyHref(key, message);
  };
  const selectedPearl = pearls.find((pearl) => pearlKey(pearl) === historyKey);
  const versionPearl = version ? pearls.find((pearl) => pearl.commit === version) : undefined;

  // Meta-model view: #meta-model
  const showMetaModel = route.view === "app" && route.name === "meta-model";

  const ctx: Ctx = { ix, state, update, ...(hasDiff ? { diffDocuments } : {}) };
  const webView = useMemo<WebView>(
    () => ({
      labels: { model: "platform design" },
      isBlock: isElementBlock,
      renderNodes: (props) => <NodesView ctx={ctx} {...props} />,
    }),
    // The context changes with every state change; the views read it when they render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ix, state, diffDocuments],
  );

  const diffElementLink = (id: string) => {
    const href = ix.elementHref(id);
    return href ? { href } : null;
  };

  return (
    <WebViewProvider value={webView}>
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
        <Sidebar
          ctx={ctx}
          onTheme={toggleTheme}
          view={showHistory ? "history" : showChanges ? "changes" : "document"}
          changes={hasDiff ? diffDocuments : undefined}
          history={
            history
              ? {
                  onSelect: () => {
                    if (version) openVersion(null, historyHref(version));
                    else location.hash = historyHref();
                  },
                  onSelectDocuments: () => {
                    location.hash = hasDiff ? changesHref : ix.documentHref(state.file);
                  },
                  panel: (
                    <HistoryChain
                      state={historyData.state}
                      entries={historyData.entries}
                      chunkErrors={historyData.chunkErrors}
                      requestChunk={historyData.requestChunk}
                      selectedKey={historyKey}
                      onSelect={(key) => selectPearl(key)}
                    />
                  ),
                }
              : undefined
          }
          onMetaModel={() => {
            location.hash = "meta-model";
            update((s) => (s.sidebarOpen = false));
          }}
          showMetaModel={showMetaModel}
        />
        <main className="main">
          {version && (
            <p className="version-banner" role="status" data-testid="version-banner">
              <span>
                Earlier version <code>{version.slice(0, 8)}</code>
                {versionPearl && (
                  <>
                    {" "}
                    · {versionPearl.subject} · {versionPearl.date.slice(0, 10)}
                  </>
                )}
              </span>
              <a
                href={versionHref(null)}
                data-testid="version-leave"
                onClick={(event) => {
                  event.preventDefault();
                  openVersion(null);
                }}
              >
                Back to the current version
              </a>
            </p>
          )}
          {showHistory ? (
            <HistoryEntryView
              pearl={selectedPearl}
              entry={historyKey ? historyData.entries.get(historyKey) : undefined}
              chunkError={
                selectedPearl ? historyData.chunkErrors.get(selectedPearl.chunk) : undefined
              }
              requestChunk={historyData.requestChunk}
              viewMode={state.mode}
              elementHref={(id) => ix.elementHref(id)}
              messageOpen={historyMessage}
              onToggleMessage={() => historyKey && selectPearl(historyKey, !historyMessage)}
              onBrowse={(commit) => openVersion(commit)}
            />
          ) : showChanges ? (
            <ChangesView
              diff={diff}
              error={diffError}
              viewMode={state.mode}
              elementLink={diffElementLink}
              documentLink={(file) => ({ href: ix.documentHref(file) })}
            />
          ) : showMetaModel ? (
            <MetaModelView
              onNavigateToKind={(kind) => {
                const doc = ix.stepDocument(kind) ?? ix.payload.documents[0];
                if (doc) location.hash = ix.documentHref(doc.filePath);
              }}
            />
          ) : (
            <DocumentView ctx={ctx} />
          )}
        </main>
      </div>
    </WebViewProvider>
  );
}
