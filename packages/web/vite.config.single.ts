import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

// One self-contained index.html for `pdt42 build --single-file` (opens from disk).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: resolve(import.meta.dirname),
  resolve: { conditions: ["development"] },
  build: {
    outDir: resolve(import.meta.dirname, "dist-single"),
    emptyOutDir: true,
  },
});
