import { describe, expect, it } from "vitest";

import {
  ACCOUNT_PROGRESSION_SYSTEM,
  FORBIDDEN_ACCOUNT_CURRENCIES,
  canRenderAccountSignal,
  workspaceActionToSignalEvent,
} from "@/lib/signal-progression/canonical";
import { emptySignalHub } from "@/lib/account/test-fixtures";

describe("canonical account progression", () => {
  it("keeps Signal as the only account currency", () => {
    expect(ACCOUNT_PROGRESSION_SYSTEM).toBe("signal");
    expect(FORBIDDEN_ACCOUNT_CURRENCIES).toContain("xp");
  });

  it("does not invent Signal UI when flags or hub are missing", () => {
    expect(
      canRenderAccountSignal({ progressionUiEnabled: true }, null),
    ).toBe(false);
    expect(
      canRenderAccountSignal(
        { progressionUiEnabled: false },
        emptySignalHub(),
      ),
    ).toBe(false);
    expect(
      canRenderAccountSignal(
        { progressionUiEnabled: true },
        emptySignalHub(),
      ),
    ).toBe(true);
  });

  it("maps only meaningful save actions and never invents XP events", () => {
    expect(
      workspaceActionToSignalEvent({
        type: "saved/set",
        slug: "cursor",
        saved: true,
        at: "2026-08-01T00:00:00.000Z",
      }),
    ).toBe("tool_saved");
    expect(
      workspaceActionToSignalEvent({
        type: "stacks/create",
        id: "ai-coding",
        name: "AI Coding",
        at: "2026-08-01T00:00:00.000Z",
      }),
    ).toBeNull();
  });
});
