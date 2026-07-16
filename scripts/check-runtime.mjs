import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const EXPECTED_NODE = "22.23.1";
const EXPECTED_NPM = "10.9.2";

function readNpmVersion() {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) {
    return null;
  }

  try {
    const packagePath = resolve(dirname(npmExecPath), "..", "package.json");
    return JSON.parse(readFileSync(packagePath, "utf8")).version ?? null;
  } catch {
    return null;
  }
}

const actualNode = process.versions.node;
const actualNpm = readNpmVersion();

const failures = [];

if (actualNode !== EXPECTED_NODE) {
  failures.push(`Node ${EXPECTED_NODE} required; found ${actualNode}.`);
}

if (actualNpm !== EXPECTED_NPM) {
  failures.push(
    actualNpm
      ? `npm ${EXPECTED_NPM} required; found ${actualNpm}.`
      : `npm ${EXPECTED_NPM} required; run this check through npm.`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[runtime] ${failure}`);
  }
  process.exit(1);
}

console.log(`[runtime] Node ${actualNode} / npm ${actualNpm} OK`);
