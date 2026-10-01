import type { DiffDocument } from "@cli42/lib/diff";
import type { WorkspaceIndex } from "./workspace.ts";

export type ViewMode = "human" | "agent";

export interface ViewState {
  /** The active chapter. */
  file: string;
  mode: ViewMode;
  /** Elements whose model box replaces their prose. */
  expanded: Set<string>;
  /** Anchor id to scroll to after the next render. */
  scrollTo: string | null;
  sidebarOpen: boolean;
}

/** What every view needs: the indexed workspace, the state, and a way to change it. */
export interface Ctx {
  ix: WorkspaceIndex;
  state: ViewState;
  update(change: (state: ViewState) => void): void;
  /** The chapters a visualized difference changes, by path (`serve`/`build --diff`). */
  diffDocuments?: Map<string, DiffDocument>;
}
