import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { isSupportedNpmVersion } from "@/scripts/check-runtime.mjs";

function readJson(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.resolve(relativePath), "utf8"),
  ) as Record<string, unknown>;
}

describe("release runtime contract", () => {
  it("accepts Cloudflare-compatible stable npm 10 releases", () => {
    expect(isSupportedNpmVersion("10.9.2")).toBe(true);
    expect(isSupportedNpmVersion("10.9.8")).toBe(true);
    expect(isSupportedNpmVersion("10.10.0")).toBe(true);
  });

  it("rejects older or next-major npm releases", () => {
    expect(isSupportedNpmVersion("10.9.1")).toBe(false);
    expect(isSupportedNpmVersion("9.9.9")).toBe(false);
    expect(isSupportedNpmVersion("11.0.0")).toBe(false);
    expect(isSupportedNpmVersion("10.9.8-beta.0")).toBe(false);
    expect(isSupportedNpmVersion("invalid")).toBe(false);
    expect(isSupportedNpmVersion(null)).toBe(false);
  });

  it("executes the real preinstall entrypoint through npm", () => {
    const npmExecPath = process.env.npm_execpath;
    expect(npmExecPath).toBeTruthy();

    if (!npmExecPath) {
      throw new Error("npm_execpath is required for the runtime contract test");
    }

    const result = spawnSync(
      process.execPath,
      [path.resolve("scripts/check-runtime.mjs")],
      {
        encoding: "utf8",
        env: { ...process.env, npm_execpath: npmExecPath },
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(
      /^\[runtime\] Node 22\.23\.1 \/ npm 10\.\d+\.\d+ OK\r?\n$/,
    );
  });

  it("keeps package, lockfile and strict engine policy aligned", () => {
    const packageJson = readJson("package.json") as {
      engines?: Record<string, string>;
      packageManager?: string;
    };
    const packageLock = readJson("package-lock.json") as {
      packages?: Record<string, { engines?: Record<string, string> }>;
    };
    const npmrc = fs.readFileSync(path.resolve(".npmrc"), "utf8");

    expect(packageJson.engines).toEqual({
      node: "22.23.1",
      npm: ">=10.9.2 <11",
    });
    expect(packageLock.packages?.[""]?.engines).toEqual(packageJson.engines);
    expect(packageJson.packageManager).toBe("npm@10.9.2");
    expect(npmrc).toMatch(
      /(?:^|\r?\n)engine-strict=true(?:\r?\n|$)/,
    );
  });
});
