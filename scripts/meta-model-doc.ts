import { writeFileSync } from "node:fs";
import { metaModelDoc } from "../packages/core/src/meta-model-doc.ts";

writeFileSync(new URL("../docs/meta-model.md", import.meta.url), `${metaModelDoc()}\n`);
