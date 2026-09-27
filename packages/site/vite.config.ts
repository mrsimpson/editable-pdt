import { defineConfig } from "vite-plus";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(import.meta.dirname),
  // Relative URLs by default, so the site works under any GitHub Pages subpath.
  base: process.env["VITE_BASE"] ?? "./",
  resolve: { conditions: ["development"] },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
});
