import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

// No UI framework: components are plain functions that build DOM nodes through a tiny JSX
// factory (src/dom.ts), so the classic JSX transform with `h` is all the build needs.
export const jsx = { runtime: "classic", pragma: "h", pragmaFrag: "Fragment" } as const;

export default defineConfig({
  root: resolve(import.meta.dirname),
  // Relative asset URLs: a site built by `pdt42 build` works under any subpath.
  base: "./",
  oxc: { jsx },
  resolve: { conditions: ["development"] },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:4242" },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
