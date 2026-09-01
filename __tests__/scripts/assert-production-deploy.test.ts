import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const helper = path.join(root, "scripts/assert-production-deploy.mjs");

const valid = {
  branch: "main",
  trackedPorcelain: "",
  head: "b5f18eab7439e8daf6aa6a6c8cbc313d5e099f79",
  originMain: "b5f18eab7439e8daf6aa6a6c8cbc313d5e099f79",
  workerName: "tooolvibes",
  accountId: "ffacd11bfafdca87d540a6c5fbe89120",
  sha: "b5f18eab7439e8daf6aa6a6c8cbc313d5e099f79",
};

function runAssert(input: unknown) {
  const source = `
    import { assertProductionDeployContext } from ${JSON.stringify(helper)};
    try {
      assertProductionDeployContext(${JSON.stringify(input)});
      process.stdout.write("OK");
    } catch (error) {
      process.stderr.write(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  `;
  return spawnSync(process.execPath, ["--input-type=module", "--eval", source], {
    encoding: "utf8",
    cwd: root,
  });
}

describe("assertProductionDeployContext", () => {
  it("accepts a clean main production context", () => {
    const result = runAssert(valid);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("OK");
  });

  it("rejects dirty trees, wrong workers, and SHA drift", () => {
    expect(runAssert({ ...valid, branch: "feat" }).stderr).toMatch(/branch must be main/);
    expect(runAssert({ ...valid, trackedPorcelain: " M wrangler.jsonc" }).stderr).toMatch(/dirty/);
    expect(
      runAssert({
        ...valid,
        originMain: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }).stderr,
    ).toMatch(/origin\/main/);
    expect(runAssert({ ...valid, workerName: "tooolvibes-preview" }).stderr).toMatch(
      /worker name/,
    );
  });
});

describe("unguarded deploy scripts", () => {
  it("refuses npm run deploy", () => {
    const result = spawnSync("npm", ["run", "deploy"], {
      encoding: "utf8",
      cwd: root,
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/cloudflare:deploy/);
  });
});
