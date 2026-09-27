import { writeFileSync } from "node:fs";
import { SESSION_FILE, sessionJson } from "../packages/cli/tests/session.ts";

writeFileSync(SESSION_FILE, sessionJson());
