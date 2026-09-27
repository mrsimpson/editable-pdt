import { expect, test } from "vite-plus/test";
import { readSession, sessionJson } from "./session.ts";

test("demo/cli-session.json is up to date (run `pnpm demo:cli`)", () => {
  expect(readSession()).toBe(sessionJson());
});
