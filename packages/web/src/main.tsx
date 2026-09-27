import type { WorkspacePayload } from "@pdt42/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, fetchWorkspace } from "./App.tsx";
import "./styles.css";

// `pdt42 build` injects the workspace; `pdt42 serve` serves it and announces changes.

declare global {
  interface Window {
    __WORKSPACE__?: WorkspacePayload;
  }
}

async function main() {
  const container = document.getElementById("root")!;
  const injected = window.__WORKSPACE__;
  try {
    const payload = injected ?? (await fetchWorkspace());
    createRoot(container).render(
      <StrictMode>
        <App initial={payload} live={!injected} />
      </StrictMode>,
    );
  } catch (error) {
    const box = document.createElement("div");
    box.className = "load-error";
    box.innerHTML = "<h1>Could not load the workspace</h1><pre></pre>";
    box.querySelector("pre")!.textContent = String(error);
    container.replaceChildren(box);
  }
}

void main();
