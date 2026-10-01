import { execFileSync } from "node:child_process";
import { watch, existsSync, type FSWatcher } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server, type ServerResponse } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HISTORY_INDEX_FILE,
  historyChunkFile,
  historyChunkOf,
  snapshotBlobOf,
  snapshotTreeOf,
  toJsonLines,
} from "@cli42/lib/web";
import type { DocumentCommit, DocumentHistory } from "@cli42/lib/git";
import type { DiffPayload, WorkspacePayload } from "@pdt42/core";
import { load } from "./discover.ts";
import {
  chunkCommits,
  historyCommitIds,
  historyPearls,
  listHistory,
  loadDiff,
  loadHistoryEntry,
  readHistoryBlob,
  snapshotFiles,
  snapshotTree,
  type DiffSpec,
  type HistoryEntry,
} from "./git.ts";

// `pdt42 serve` and `pdt42 build`: the workspace in the browser, rendered by @pdt42/web.
// serve answers /api/workspace (and with --diff /api/diff), serves the history under
// /api/history/, and announces changes of the documents and of Git over SSE; build injects the
// workspace (and the difference, and the history) into the page, so the result works as a
// static site.

const HERE = dirname(fileURLToPath(import.meta.url));

/** The built web app: next to the bundled CLI, or in the web package when run from source. */
export function webDir(singleFile = false): string {
  const override = process.env.PDT42_WEB_DIR;
  if (override) return override;
  const candidates = singleFile
    ? [join(HERE, "web-single"), join(HERE, "../../web/dist-single")]
    : [join(HERE, "web"), join(HERE, "../../web/dist")];
  return candidates.find((dir) => existsSync(join(dir, "index.html"))) ?? candidates[0]!;
}

export async function workspacePayload(dir: string): Promise<WorkspacePayload> {
  return (await load(dir)).payload;
}

/** The workspace and, with a diff spec, the change shown: its head is the workspace. */
async function loadView(
  dir: string,
  diffSpec: DiffSpec | undefined,
): Promise<{ payload: WorkspacePayload; diff?: DiffPayload; untracked: string[] }> {
  if (!diffSpec) return { payload: await workspacePayload(dir), untracked: [] };
  const diff = await loadDiff(dir, diffSpec);
  return { payload: diff.head.payload, diff: diff.payload, untracked: diff.untracked };
}

/** Warn that documents Git does not track yet are left out of a comparison. */
export function warnUntracked(untracked: readonly string[]): void {
  for (const file of untracked) {
    process.stderr.write(
      `warning ${file}  untracked — not part of the comparison until you git add it\n`,
    );
  }
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonl": "application/x-ndjson; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function send(res: ServerResponse, status: number, type: string, body: string | Buffer) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

const sendError = (res: ServerResponse, status: number, error: string) =>
  send(res, status, TYPES[".json"]!, JSON.stringify({ error }));

/** The Git directory of the workspace, or undefined outside a repository. */
function gitDirOf(dir: string): string | undefined {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--absolute-git-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

export interface ServeOptions {
  port: number;
  host: string;
  /** Show this change (`--diff`): the workspace is its head. */
  diff?: DiffSpec;
}

export async function serve(dir: string, { port, host, diff }: ServeOptions): Promise<Server> {
  const web = webDir();
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | undefined;
  const watchers: FSWatcher[] = [];
  const announce = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) client.write("event: workspace\ndata: changed\n\n");
    }, 150);
  };
  watchers.push(
    watch(dir, { recursive: true }, (_event, file) => {
      if (file && String(file).endsWith(".pdt42.md")) announce();
    }),
  );
  // The Git index and HEAD: with --diff they define the comparison, and the history gains
  // pearls on commit.
  const gitDir = gitDirOf(dir);
  if (gitDir) {
    watchers.push(
      watch(gitDir, (_event, file) => {
        if (file === "index" || file === "HEAD") announce();
      }),
    );
  }
  let untrackedWarned = "[]";

  // History entries of commits never change; the working tree's is always recomputed.
  const entries = new Map<string, Promise<HistoryEntry>>();
  const entryOf = (commit: DocumentCommit) => {
    if (commit.commit === null) return loadHistoryEntry(dir, commit);
    let entry = entries.get(commit.commit);
    if (!entry) entries.set(commit.commit, (entry = loadHistoryEntry(dir, commit)));
    return entry;
  };

  const serveHistory = async (file: string, res: ServerResponse) => {
    let history: DocumentHistory;
    try {
      history = listHistory(dir);
    } catch (error) {
      // Not a Git repository (or Git fails): the web view shows why.
      return sendError(res, 422, error instanceof Error ? error.message : String(error));
    }
    const pearls = historyPearls(history);
    const commits = historyCommitIds(history);
    const tree = snapshotTreeOf(file);
    if (tree !== undefined) {
      if (!commits.includes(tree)) return sendError(res, 404, `No commit ${tree} in the history`);
      return send(res, 200, TYPES[".json"]!, JSON.stringify(snapshotTree(dir, tree)));
    }
    const blob = snapshotBlobOf(file);
    if (blob !== undefined) {
      try {
        return send(res, 200, "text/plain; charset=utf-8", readHistoryBlob(dir, commits, blob));
      } catch (error) {
        return sendError(res, 404, error instanceof Error ? error.message : String(error));
      }
    }
    if (file === HISTORY_INDEX_FILE) return send(res, 200, TYPES[".jsonl"]!, toJsonLines(pearls));
    const chunk = historyChunkOf(file);
    const inChunk = chunk === undefined ? [] : chunkCommits(history, pearls, chunk);
    if (!inChunk.length) return sendError(res, 404, `No history file ${file}`);
    const loaded: HistoryEntry[] = [];
    for (const commit of inChunk) loaded.push(await entryOf(commit));
    return send(res, 200, TYPES[".jsonl"]!, toJsonLines(loaded));
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;
    void (async () => {
      if (path === "/api/workspace") {
        if (!diff)
          return send(res, 200, TYPES[".json"]!, JSON.stringify(await workspacePayload(dir)));
        try {
          const view = await loadView(dir, diff);
          return send(res, 200, TYPES[".json"]!, JSON.stringify(view.payload));
        } catch {
          // The difference cannot be computed now: show the workspace as it is.
          return send(res, 200, TYPES[".json"]!, JSON.stringify(await workspacePayload(dir)));
        }
      }
      if (path === "/api/diff") {
        if (!diff) return sendError(res, 404, "pdt42 serve was started without --diff");
        try {
          const view = await loadView(dir, diff);
          const untracked = JSON.stringify(view.untracked);
          if (untracked !== untrackedWarned) warnUntracked(view.untracked);
          untrackedWarned = untracked;
          return send(res, 200, TYPES[".json"]!, JSON.stringify(view.diff));
        } catch (error) {
          return sendError(res, 500, String(error));
        }
      }
      if (path.startsWith("/api/history/")) {
        return serveHistory(path.slice("/api/history/".length), res);
      }
      if (path === "/api/workspace/events") {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        });
        res.write(": connected\n\n");
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }
      if (!existsSync(join(web, "index.html"))) {
        return send(
          res,
          503,
          "text/plain; charset=utf-8",
          "The web app is not built. Run `pnpm build` (or `pnpm --filter @pdt42/web build`).",
        );
      }
      const file = normalize(join(web, decodeURIComponent(path)));
      const inside = file.startsWith(resolve(web) + sep);
      if (inside && existsSync(file) && extname(file)) {
        return send(
          res,
          200,
          TYPES[extname(file)] ?? "application/octet-stream",
          await readFile(file),
        );
      }
      // SPA fallback: the app routes by hash.
      return send(res, 200, TYPES[".html"]!, await readFile(join(web, "index.html")));
    })().catch((error: unknown) => send(res, 500, "text/plain; charset=utf-8", String(error)));
  });
  server.on("close", () => {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
  });

  await new Promise<void>((ok, fail) => {
    server.once("error", fail);
    server.listen(port, host, () => ok());
  });
  return server;
}

/** Serialise JSON for an inline <script>: no `</script>`, no line separators that break JS. */
export function inlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** What `build` puts into the page besides the workspace. */
export interface Injected {
  diff?: DiffPayload;
  /** Where the history files are (`{ base: "history/" }`), or the files themselves. */
  history?: { base: string } | { files: Record<string, string> };
}

/** Put the workspace (and difference, and history) into the page, after the charset declaration. */
export function injectWorkspace(
  html: string,
  payload: WorkspacePayload,
  injected: Injected = {},
): string {
  const script =
    `<script>window.__WORKSPACE__=${inlineJson(payload)};</script>` +
    (injected.diff ? `<script>window.__DIFF__=${inlineJson(injected.diff)};</script>` : "") +
    (injected.history
      ? `<script>window.__HISTORY__=${inlineJson(injected.history)};</script>`
      : "");
  const title = `<title>${payload.name.replace(/[<&]/g, "")} · pdt42</title>`;
  const withTitle = html.replace(/<title>[^<]*<\/title>/, title);
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(withTitle);
  if (!charset) return withTitle.replace(/<head>/i, `<head>${script}`);
  const at = charset.index + charset[0].length;
  return withTitle.slice(0, at) + script + withTitle.slice(at);
}

export interface BuildOptions {
  singleFile?: boolean;
  /** Show this change: the workspace is its head. */
  diff?: DiffSpec;
  /** Include the history (next to the page, or inside it with singleFile). */
  withHistory?: boolean;
}

export async function build(
  dir: string,
  out: string,
  /** The options, or whether to write one self-contained HTML file. */
  settings: BuildOptions | boolean = {},
): Promise<string> {
  const options = typeof settings === "boolean" ? { singleFile: settings } : settings;
  const singleFile = options.singleFile === true;
  const web = webDir(singleFile);
  if (!existsSync(join(web, "index.html"))) {
    throw new Error(`The web app is not built (${web}). Run \`pnpm build\` first.`);
  }
  const view = await loadView(dir, options.diff);
  warnUntracked(view.untracked);

  // The history is computed before anything is written: outside a Git repository
  // --with-history fails without leaving a partial site behind.
  const historyFiles: Record<string, string> = {};
  if (options.withHistory) {
    const history = listHistory(dir);
    const pearls = historyPearls(history);
    historyFiles[HISTORY_INDEX_FILE] = toJsonLines(pearls);
    for (const chunk of new Set(pearls.map((pearl) => pearl.chunk))) {
      const loaded: HistoryEntry[] = [];
      for (const commit of chunkCommits(history, pearls, chunk)) {
        loaded.push(await loadHistoryEntry(dir, commit));
      }
      historyFiles[historyChunkFile(chunk)] = toJsonLines(loaded);
    }
    Object.assign(historyFiles, snapshotFiles(dir, history));
  }

  // Replace what an earlier build wrote (hashed assets pile up otherwise), but nothing else:
  // the output folder may hold other things, like the landing page around the example.
  await rm(join(out, "assets"), { recursive: true, force: true });
  await rm(join(out, "history"), { recursive: true, force: true });
  await rm(join(out, "index.html"), { force: true });
  await mkdir(out, { recursive: true });
  if (!singleFile) await cp(web, out, { recursive: true });
  if (options.withHistory && !singleFile) {
    for (const [name, content] of Object.entries(historyFiles)) {
      const target = join(out, "history", name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
    }
  }
  const html = await readFile(join(web, "index.html"), "utf8");
  const target = join(out, "index.html");
  const injected: Injected = {
    ...(view.diff ? { diff: view.diff } : {}),
    ...(options.withHistory
      ? { history: singleFile ? { files: historyFiles } : { base: "history/" } }
      : {}),
  };
  await writeFile(target, injectWorkspace(html, view.payload, injected), "utf8");
  return target;
}
