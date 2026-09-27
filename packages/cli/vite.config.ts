import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/cli.ts",
    dts: false,
    // Start from an empty bundle: the web app is copied in again below, and hashed assets of
    // earlier builds would otherwise be published too.
    clean: ["dist/cli.mjs", "dist/web", "dist/web-single"],
    deps: {
      onlyBundle: false,
      alwaysBundle: ["@pdt42/core"],
    },
    inputOptions: {
      // An import the bundler cannot resolve stays external and breaks the published CLI.
      onLog(level, log, handler) {
        if (log.code === "UNRESOLVED_IMPORT") handler("error", log);
        else handler(level, log);
      },
    },
    // The web app for `pdt42 serve` and `pdt42 build`, next to the bundle (see src/serve.ts).
    copy: [
      { from: "../../packages/web/dist/index.html", to: "dist/web", flatten: true },
      { from: "../../packages/web/dist/assets/*", to: "dist/web/assets", flatten: true },
      { from: "../../packages/web/dist-single/index.html", to: "dist/web-single", flatten: true },
    ],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
