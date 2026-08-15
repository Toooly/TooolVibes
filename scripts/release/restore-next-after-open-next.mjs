import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const expected = "15.5.22";
let actual = "";
try {
  actual = require("next/package.json").version;
} catch {
  actual = "";
}
if (actual !== expected) {
  execSync(`npm install next@${expected} --no-save`, { stdio: "inherit" });
}
console.log(`[open-next] next@${expected} ready for local QA`);
