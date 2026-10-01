import { watch, existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server, type ServerResponse } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkspacePayload } from "@pdt42/core";
import { load } from "./discover.ts";

// `pdt42 serve` and `pdt42 build`: the workspace in the browser, rendered by @pdt42/web.
// serve answers /api/workspace and announces file changes over SSE; build injects the
// workspace into the page as window.__WORKSPACE__, so the result works as a static site.

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

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function send(res: ServerResponse, status: number, type: string, body: string | Buffer) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

export interface ServeOptions {
  port: number;
  host: string;
}

export async function serve(dir: string, { port, host }: ServeOptions): Promise<Server> {
  const web = webDir();
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | undefined;
  watch(dir, { recursive: true }, (_event, file) => {
    if (!file || !String(file).endsWith(".pdt42.md")) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) client.write("event: workspace\ndata: changed\n\n");
    }, 150);
  });

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;
    void (async () => {
      if (path === "/api/workspace") {
        return send(res, 200, TYPES[".json"]!, JSON.stringify(await workspacePayload(dir)));
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

/** Put the workspace into the page, right after the charset declaration. */
export function injectWorkspace(html: string, payload: WorkspacePayload): string {
  const script = `<script>window.__WORKSPACE__=${inlineJson(payload)};</script>`;
  const title = `<title>${payload.name.replace(/[<&]/g, "")} · pdt42</title>`;
  const withTitle = html.replace(/<title>[^<]*<\/title>/, title);
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(withTitle);
  if (!charset) return withTitle.replace(/<head>/i, `<head>${script}`);
  const at = charset.index + charset[0].length;
  return withTitle.slice(0, at) + script + withTitle.slice(at);
}

export async function build(dir: string, out: string, singleFile: boolean): Promise<string> {
  const web = webDir(singleFile);
  if (!existsSync(join(web, "index.html"))) {
    throw new Error(`The web app is not built (${web}). Run \`pnpm build\` first.`);
  }
  // Replace what an earlier build wrote (hashed assets pile up otherwise), but nothing else:
  // the output folder may hold other things, like the landing page around the example.
  await rm(join(out, "assets"), { recursive: true, force: true });
  await rm(join(out, "index.html"), { force: true });
  await mkdir(out, { recursive: true });
  if (!singleFile) await cp(web, out, { recursive: true });
  const html = await readFile(join(web, "index.html"), "utf8");
  const target = join(out, "index.html");
  await writeFile(target, injectWorkspace(html, await workspacePayload(dir)), "utf8");
  return target;
}
