import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  DEFAULT_REWARD_PREFERENCES,
  parseRewardPreferences,
  readRewardPreferences,
  writeRewardPreferences,
} from "@/lib/rewards/preferences";

describe("reward preferences", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back on corruption", () => {
    expect(parseRewardPreferences({ version: 9, foo: true })).toEqual(
      DEFAULT_REWARD_PREFERENCES,
    );
  });

  it("round-trips valid preferences", () => {
    const next = writeRewardPreferences({
      ...DEFAULT_REWARD_PREFERENCES,
      quietMode: true,
      muteRewardSounds: true,
    });
    expect(next.quietMode).toBe(true);
    expect(readRewardPreferences().muteRewardSounds).toBe(true);
  });

  it("is SSR-safe without window", () => {
    vi.stubGlobal("window", undefined);
    expect(readRewardPreferences()).toEqual(DEFAULT_REWARD_PREFERENCES);
  });
});
