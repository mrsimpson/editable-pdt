import { MarkdownProseRenderer } from "@cli42/lib/markdown";
import { parseDocumentAsync } from "@cli42/lib/notation";
import { buildWorkspace, type Workspace } from "./model.ts";
import { parseMarkdown } from "./parser.ts";
import { progress, type StepStatus } from "./progress.ts";
import { toPayload, type WorkspacePayload } from "./payload.ts";
import { validate, type Diagnostic } from "./validator.ts";

// Files in, model out: what `pdt42 validate`, `serve` and `build` load, and what the web view
// builds an earlier version from. Prose is rendered once, here (renderedHtml on prose nodes), the
// same way in every *42 language — raw HTML shown as text, only safe links kept.

const renderer = new MarkdownProseRenderer();

const parser = { parse: parseMarkdown };

export interface LoadedWorkspace {
  workspace: Workspace;
  diagnostics: Diagnostic[];
  steps: StepStatus[];
  payload: WorkspacePayload;
}

/** Parse, render, build and validate the files of a workspace (paths relative to it). */
export async function loadWorkspaceFromFiles(
  files: ReadonlyArray<{ path: string; content: string }>,
): Promise<LoadedWorkspace> {
  const documents = await Promise.all(
    files.map((file) => parseDocumentAsync(file.path, file.content, parser, renderer)),
  );
  const workspace = buildWorkspace(documents);
  const diagnostics = validate(workspace);
  const steps = progress(workspace, diagnostics);
  return { workspace, diagnostics, steps, payload: toPayload(workspace, diagnostics, steps) };
}
