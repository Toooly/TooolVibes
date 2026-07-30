import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("signal client boundary", () => {
  it("client module never embeds spDelta rules", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/signal-progression/client.ts"),
      "utf8",
    );
    expect(source).not.toContain("spDelta");
    expect(source).not.toContain("SIGNAL_REWARD_RULES");
    expect(source).not.toContain("GLOBAL_DAILY_SP_CAP");
    expect(source).toContain("configureSignalClient");
  });

  it("rules remain server-only", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/signal-progression/rules.ts"),
      "utf8",
    );
    expect(source.startsWith('import "server-only"')).toBe(true);
  });

  it("product bridge does not import server rules", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components/rewards/signal-product-bridge.tsx"),
      "utf8",
    );
    expect(source).not.toContain("server-only");
    expect(source).not.toContain("SIGNAL_REWARD_RULES");
    expect(source).toContain("configureSignalClient");
  });
});
