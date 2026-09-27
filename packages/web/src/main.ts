import type { WorkspacePayload } from "@pdt42/core";
import { startApp } from "./App.tsx";
import "./styles.css";

// `pdt42 build` injects the workspace; `pdt42 serve` serves it and announces changes.

declare global {
  interface Window {
    __WORKSPACE__?: WorkspacePayload;
  }
}

async function fetchWorkspace(): Promise<WorkspacePayload> {
  const res = await fetch("./api/workspace", { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as WorkspacePayload;
}

async function main() {
  const root = document.getElementById("root")!;
  const injected = window.__WORKSPACE__;
  try {
    const app = startApp(root, injected ?? (await fetchWorkspace()));
    if (!injected && "EventSource" in window) {
      const events = new EventSource("./api/workspace/events");
      events.addEventListener("workspace", () => {
        fetchWorkspace().then(
          (payload) => app.load(payload),
          (error: unknown) => console.error(error),
        );
      });
    }
  } catch (error) {
    root.innerHTML = "";
    const box = document.createElement("div");
    box.className = "load-error";
    box.innerHTML = "<h1>Could not load the workspace</h1><pre></pre>";
    box.querySelector("pre")!.textContent = String(error);
    root.appendChild(box);
  }
}

void main();
