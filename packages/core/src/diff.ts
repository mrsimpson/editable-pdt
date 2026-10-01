import {
  buildDiffView as buildView,
  consistencyFindings,
  diffWorkspaces as diffSnapshots,
} from "@cli42/lib/diff";
import type { ConsistencyFinding, DiffOptions, DiffView, WorkspaceDiff } from "@cli42/lib/diff";
import { proseRelevanceOf } from "@cli42/lib/model";
import type { WorkspacePayload } from "./payload.ts";
import { BLOCK_SCHEMAS } from "./schemas.ts";

// The semantic diff of two versions of a workspace — the diff every *42 language has
// (@cli42/lib/diff), typed with pdt42's model: what `pdt42 diff` reports, `serve --diff` and
// `build --diff` show, and every pearl of the history holds.

export type PlatformDesignDiff = WorkspaceDiff<WorkspacePayload>;
export type DiffFinding = ConsistencyFinding;

export const DIFF_OPTIONS: DiffOptions = {
  // A block sits under a heading (EG04), so a document preamble holds no elements.
  rejectPreambleBlocks: true,
  // A prose-only change is a finding only when it names a fact of the block or an element the
  // model does not connect to it.
  proseRelevance: proseRelevanceOf(BLOCK_SCHEMAS),
};

export function diffWorkspaces(base: WorkspacePayload, head: WorkspacePayload): PlatformDesignDiff {
  return diffSnapshots(base, head, DIFF_OPTIONS);
}

export interface DiffResult {
  model: PlatformDesignDiff;
  /** Consistency findings (block and prose not changed together), in document order. */
  findings: DiffFinding[];
}

/** Lint a change: the semantic diff, and where a block and its prose did not change together. */
export function lintDiff(base: WorkspacePayload, head: WorkspacePayload): DiffResult {
  const model = diffWorkspaces(base, head);
  return { model, findings: consistencyFindings(model.elements) };
}

/** A change, render-ready: what the web view's changes view and history show. */
export interface DiffPayload {
  base: { label: string; commit: string };
  head: { label: string };
  /** Documents Git does not track yet: in the working tree, but not part of the comparison. */
  untracked?: string[];
  findings: DiffFinding[];
  view: DiffView<WorkspacePayload>;
}

export function buildDiffView(
  base: WorkspacePayload,
  head: WorkspacePayload,
  diff: PlatformDesignDiff = diffWorkspaces(base, head),
): DiffView<WorkspacePayload> {
  return buildView(base, head, diff, DIFF_OPTIONS);
}
