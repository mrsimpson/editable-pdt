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
    // The landing page, and the PDT canvases next to pdt42's.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        canvases: resolve(import.meta.dirname, "canvases/index.html"),
      },
    },
  },
  server: {
    port: 5174,
  },
});
