import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_NODE = "22.23.1";
const MINIMUM_NPM = "10.9.2";
const NPM_ENGINE_RANGE = ">=10.9.2 <11";

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:\+.*)?$/.exec(value ?? "");
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function isSupportedNpmVersion(value) {
  const actual = parseVersion(value);
  const minimum = parseVersion(MINIMUM_NPM);

  return Boolean(
    actual &&
      minimum &&
      actual[0] === 10 &&
      compareVersions(actual, minimum) >= 0,
  );
}

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

function runRuntimeCheck() {
  const actualNode = process.versions.node;
  const actualNpm = readNpmVersion();
  const failures = [];

  if (actualNode !== EXPECTED_NODE) {
    failures.push(`Node ${EXPECTED_NODE} required; found ${actualNode}.`);
  }

  if (!isSupportedNpmVersion(actualNpm)) {
    failures.push(
      actualNpm
        ? `npm ${NPM_ENGINE_RANGE} required; found ${actualNpm}.`
        : `npm ${NPM_ENGINE_RANGE} required; run this check through npm.`,
    );
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`[runtime] ${failure}`);
    }
    process.exit(1);
  }

  console.log(`[runtime] Node ${actualNode} / npm ${actualNpm} OK`);
}

function isDirectInvocation() {
  if (!process.argv[1]) {
    return false;
  }

  try {
    return (
      realpathSync(resolve(process.argv[1])) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  runRuntimeCheck();
}
