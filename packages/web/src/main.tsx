import type { DiffPayload, WorkspacePayload } from "@pdt42/core";
import type { HistorySource } from "@cli42/lib/web";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./App.tsx";
import "@cli42/lib/web-react/styles.css";
import "./styles.css";

// `pdt42 build` injects the workspace (with --diff the difference, with --with-history where the
// history is); `pdt42 serve` serves them and announces changes.

declare global {
  interface Window {
    __WORKSPACE__?: WorkspacePayload;
    __DIFF__?: DiffPayload;
    __HISTORY__?: HistorySource;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
