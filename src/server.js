import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { toJSON } from "./core/model.js";
import { renderPage } from "./render/page.js";
import { createElement, deleteElement, editElement, EditError, loadWorkspace } from "./workspace.js";

// `pdt serve`: the canvases, live. Edits in the browser are written straight
// into the .pdt.md files; edits to the files (by you, your editor or an
// agent) reload every open browser.

const SRC = dirname(fileURLToPath(import.meta.url));
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml" };

export function serve(dir, { port = 4242, host = "127.0.0.1" } = {}) {
  const clients = new Set();
  let timer;
  watch(dir, { recursive: true }, (_event, file) => {
    if (!file || !String(file).endsWith(".pdt.md")) return;
    clearTimeout(timer);
    timer = setTimeout(() => clients.forEach((res) => res.write("data: change\n\n")), 120);
  });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const { workspace, diagnostics } = await loadWorkspace(dir);
        const script = `<script type="module" src="/src/web/app.js"></script>`;
        return send(res, 200, "text/html", renderPage(toJSON(workspace), diagnostics, { editable: true, cssHref: "/src/render/theme.css", script }));
      }
      if (url.pathname === "/api/model") return json(res, 200, await snapshot(dir));
      if (url.pathname === "/api/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
        res.write(": connected\n\n");
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }
      if (url.pathname === "/api/elements" && req.method === "POST") {
        const id = await createElement(dir, await body(req));
        return json(res, 201, { id, ...(await snapshot(dir)) });
      }
      const match = url.pathname.match(/^\/api\/elements\/([^/]+)$/);
      if (match && req.method === "PUT") {
        const id = await editElement(dir, decodeURIComponent(match[1]), await body(req));
        return json(res, 200, { id, ...(await snapshot(dir)) });
      }
      if (match && req.method === "DELETE") {
        await deleteElement(dir, decodeURIComponent(match[1]));
        return json(res, 200, await snapshot(dir));
      }
      if (url.pathname.startsWith("/src/")) {
        const path = resolve(SRC, "." + url.pathname.slice(4));
        if (!path.startsWith(SRC + sep) || url.pathname.includes("..")) return send(res, 403, "text/plain", "Forbidden");
        return send(res, 200, TYPES[extname(path)] ?? "application/octet-stream", await readFile(path));
      }
      send(res, 404, "text/plain", "Not found");
    } catch (error) {
      if (error instanceof EditError) return json(res, error.status, { error: error.message });
      if (error.code === "ENOENT") return send(res, 404, "text/plain", "Not found");
      console.error(error);
      json(res, 500, { error: error.message });
    }
  });
  return new Promise((ok) => server.listen(port, host, () => ok(server)));
}

async function snapshot(dir) {
  const { workspace, diagnostics } = await loadWorkspace(dir);
  return { model: toJSON(workspace), diagnostics };
}

function send(res, status, type, content) {
  res.writeHead(status, { "content-type": `${type}; charset=utf-8`, "cache-control": "no-store" });
  res.end(content);
}

function json(res, status, data) {
  send(res, status, "application/json", JSON.stringify(data));
}

async function body(req) {
  let text = "";
  for await (const chunk of req) text += chunk;
  if (text.length > 1e6) throw new EditError(413, "Request too large");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new EditError(400, "Body is not JSON");
  }
}

