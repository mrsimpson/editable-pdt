import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(import.meta.dirname),
  // Relative asset URLs: a site built by `pdt42 build` works under any subpath.
  base: "./",
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
