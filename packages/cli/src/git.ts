import {
  commitDiffSpec,
  errorMessage,
  listDocumentHistory,
  readCommitFiles as readFiles,
  readDocumentBlob,
  resolveComparison,
  untrackedDocuments,
  workspaceLocation,
  workspacePath,
} from "@cli42/lib/git";
import type { DiffSpec, DocumentCommit, DocumentHistory, SnapshotSource } from "@cli42/lib/git";
import { changeCounts, isSemanticChange } from "@cli42/lib/diff";
import { renderMarkdown } from "@cli42/lib/markdown";
import {
  snapshotBlobFile,
  snapshotTreeFile,
  toHistoryPearls,
  type HistoryEntry as Entry,
  type HistoryPearl,
  type SnapshotTree,
} from "@cli42/lib/web";
import {
  buildDiffView,
  lintDiff,
  loadWorkspaceFromFiles,
  type DiffPayload,
  type DiffResult,
  type WorkspacePayload,
} from "@pdt42/core";

// The workspace in Git: two versions of it compared (`pdt42 diff`, `serve --diff`,
// `build --diff`), and its history (`serve`, `build --with-history`) in the history format of
// every *42 web view (@cli42/lib/web). Document paths are relative to the workspace, as in
// every other pdt42 command, so steps keep finding their chapter files.

export type { DiffSpec } from "@cli42/lib/git";

const EXTENSION = ".pdt42.md";
const isDocument = (path: string) => path.endsWith(EXTENSION);

/** The workspace's place in its repository: root, and the prefix of its documents' paths. */
function location(dir: string) {
  const { root, inWorkspace } = workspaceLocation(dir);
  const prefix = workspacePath(root, dir);
  const relative = (path: string) => (prefix ? path.slice(prefix.length + 1) : path);
  return { root, inWorkspace, relative };
}

export interface Snapshot {
  /** "working tree", "index", or the resolved commit id. */
  label: string;
  payload: WorkspacePayload;
}

export interface LoadedDiff {
  base: Snapshot;
  head: Snapshot;
  baseCommit: string;
  /** The commit a `PDT42_CONSISTENT` acceptance must name; undefined for a staged base. */
  acceptanceBase?: string;
  /** Documents of the workspace Git does not track yet (head = working tree only). */
  untracked: string[];
  result: DiffResult;
  payload: DiffPayload;
}

/** Load both versions of a change, lint it and build its render-ready view. */
export async function loadDiff(dir: string, spec: DiffSpec = {}): Promise<LoadedDiff> {
  const { root, inWorkspace, relative } = location(dir);
  const comparison = resolveComparison(root, spec);
  const load = async (source: SnapshotSource): Promise<Snapshot> => {
    const paths = source
      .paths()
      .filter((path) => isDocument(path) && inWorkspace(path))
      .sort((a, b) => a.localeCompare(b));
    const { payload } = await loadWorkspaceFromFiles(
      paths.map((path) => ({ path: relative(path), content: source.read(path) })),
    );
    return { label: source.label, payload };
  };
  const base = await load(comparison.base);
  const head = await load(comparison.head);
  const untracked = untrackedDocuments(
    root,
    comparison,
    (path) => isDocument(path) && inWorkspace(path),
  ).map(relative);
  const result = lintDiff(base.payload, head.payload);
  return {
    base,
    head,
    baseCommit: comparison.baseCommit,
    acceptanceBase: comparison.acceptanceBase,
    untracked,
    result,
    payload: {
      base: { label: base.label, commit: comparison.baseCommit },
      head: { label: head.label },
      ...(untracked.length > 0 ? { untracked } : {}),
      findings: result.findings,
      view: buildDiffView(base.payload, head.payload, result.model),
    },
  };
}

// ─── History ─────────────────────────────────────────────────────────────────

/** A pearl's entry, with pdt42's difference. */
export type HistoryEntry = Entry<DiffPayload>;

/** The first-parent commits that touched the workspace's documents, newest first. */
export function listHistory(dir: string): DocumentHistory {
  return listDocumentHistory(dir, [EXTENSION]);
}

export function historyPearls(history: DocumentHistory): HistoryPearl[] {
  return toHistoryPearls(history.commits);
}

/** The entry of one pearl: its change against its first parent, and its message (Markdown). */
export async function loadHistoryEntry(dir: string, commit: DocumentCommit): Promise<HistoryEntry> {
  const messageHtml = commit.body ? renderMarkdown(commit.body) : "";
  try {
    const { payload, result } = await loadDiff(dir, commitDiffSpec(commit));
    return {
      commit: commit.commit,
      messageHtml,
      semantic: isSemanticChange(result.model),
      ...changeCounts(result.model),
      diff: payload,
    };
  } catch (error) {
    // One commit that cannot be diffed does not hide the rest of the history.
    return {
      commit: commit.commit,
      messageHtml,
      semantic: false,
      added: 0,
      modified: 0,
      removed: 0,
      error: errorMessage(error),
    };
  }
}

/** The commits of one chunk, in pearl order. */
export function chunkCommits(
  history: DocumentHistory,
  pearls: readonly HistoryPearl[],
  chunk: number,
): DocumentCommit[] {
  return history.commits.filter((_, index) => pearls[index]!.chunk === chunk);
}

export function historyCommitIds(history: DocumentHistory): string[] {
  return history.commits.flatMap((commit) => (commit.commit ? [commit.commit] : []));
}

/** The documents of the workspace at one commit: workspace-relative path → blob id. */
export function snapshotTree(dir: string, commit: string): SnapshotTree {
  const { relative } = location(dir);
  const { files } = readFiles(dir, commit, isDocument);
  return {
    files: Object.fromEntries(Object.entries(files).map(([path, id]) => [relative(path), id])),
  };
}

/** One document of the history by its blob id; any other blob of the repository is refused. */
export function readHistoryBlob(dir: string, commits: readonly string[], id: string): string {
  return readDocumentBlob(dir, commits, id, isDocument, "Not a pdt42 document of this history");
}

/** Every snapshot file of a history: a tree per commit, each document once under its blob id. */
export function snapshotFiles(dir: string, history: DocumentHistory): Record<string, string> {
  const commits = historyCommitIds(history);
  const files: Record<string, string> = {};
  const blobs = new Set<string>();
  for (const commit of commits) {
    const tree = snapshotTree(dir, commit);
    files[snapshotTreeFile(commit)] = JSON.stringify(tree);
    for (const id of Object.values(tree.files)) blobs.add(id);
  }
  for (const id of blobs) files[snapshotBlobFile(id)] = readHistoryBlob(dir, commits, id);
  return files;
}
