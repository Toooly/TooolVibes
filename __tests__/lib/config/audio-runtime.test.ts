import { afterEach, describe, expect, it } from "vitest";

import {
  isReleaseAudioEnabled,
  setReleaseAudioEnabled,
} from "@/lib/config/audio-runtime";

describe("release audio runtime", () => {
  afterEach(() => setReleaseAudioEnabled(false));

  it("is fail-closed", () => {
    setReleaseAudioEnabled(false);
    expect(isReleaseAudioEnabled()).toBe(false);
  });

  it("changes only through the release boundary setter", () => {
    setReleaseAudioEnabled(true);
    expect(isReleaseAudioEnabled()).toBe(true);
    setReleaseAudioEnabled(false);
    expect(isReleaseAudioEnabled()).toBe(false);
  });
});
