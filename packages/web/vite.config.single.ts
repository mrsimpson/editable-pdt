import { defineConfig, type Plugin } from "vite-plus";
import { resolve } from "node:path";
import { jsx } from "./vite.config.ts";

// One self-contained index.html for `pdt42 build --single-file` (opens from disk): the
// script and stylesheet are inlined into the page after bundling.
function singleFile(): Plugin {
  return {
    name: "pdt42:single-file",
    enforce: "post",
    generateBundle(_options, bundle) {
      const page = Object.values(bundle).find(
        (item) => item.type === "asset" && item.fileName.endsWith(".html"),
      );
      if (!page || page.type !== "asset") return;
      let html = String(page.source);
      for (const [name, item] of Object.entries(bundle)) {
        const tag = (attr: string) =>
          new RegExp(
            `<[^>]*${attr}="[^"]*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>(</script>)?`,
          );
        if (item.type === "chunk") {
          const code = item.code.replace(/<\/script/gi, "<\\/script");
          html = html.replace(tag("src"), () => `<script type="module">${code}</script>`);
          delete bundle[name];
        } else if (name.endsWith(".css")) {
          html = html.replace(tag("href"), () => `<style>${String(item.source)}</style>`);
          delete bundle[name];
        }
      }
      page.source = html;
    },
  };
}

export default defineConfig({
  plugins: [singleFile()],
  root: resolve(import.meta.dirname),
  oxc: { jsx },
  resolve: { conditions: ["development"] },
  build: {
    outDir: resolve(import.meta.dirname, "dist-single"),
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
  },
});
