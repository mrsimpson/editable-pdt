import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/cli.ts",
    dts: false,
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
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
