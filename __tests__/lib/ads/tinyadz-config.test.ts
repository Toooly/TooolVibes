import { describe, expect, it } from "vitest";

import {
  isTinyAdzEligiblePath,
  readTinyAdzConfig,
  TINYADZ_ENABLED_ENV,
  TINYADZ_SCRIPT_ID,
  TINYADZ_SCRIPT_URL,
  TINYADZ_SITE_ID_ENV,
  TINYADZ_TEST_MODE_ENV,
} from "@/lib/ads/tinyadz-config";

const OFF = { [TINYADZ_ENABLED_ENV]: "0" };
const ON = { [TINYADZ_ENABLED_ENV]: "1" };

describe("readTinyAdzConfig", () => {
  it("defaults to disabled, no site id and test mode on", () => {
    const config = readTinyAdzConfig({});
    expect(config.enabled).toBe(false);
    expect(config.siteId).toBeNull();
    expect(config.testMode).toBe("true");
  });

  it("parses boolean flags loosely (1/true/on/yes and 0/false/off/no)", () => {
    expect(readTinyAdzConfig(ON).enabled).toBe(true);
    expect(readTinyAdzConfig({ [TINYADZ_ENABLED_ENV]: "true" }).enabled).toBe(true);
    expect(
      readTinyAdzConfig({ [TINYADZ_ENABLED_ENV]: "off" }).enabled,
    ).toBe(false);
    expect(
      readTinyAdzConfig({ [TINYADZ_ENABLED_ENV]: "garbage" }).enabled,
    ).toBe(false);
  });

  it("keeps the site id verbatim but trims empty values to null", () => {
    expect(
      readTinyAdzConfig({ [TINYADZ_SITE_ID_ENV]: "691ee1e02c1cd96006ac7374" })
        .siteId,
    ).toBe("691ee1e02c1cd96006ac7374");
    expect(
      readTinyAdzConfig({ [TINYADZ_SITE_ID_ENV]: "  " }).siteId,
    ).toBeNull();
    expect(readTinyAdzConfig({ [TINYADZ_SITE_ID_ENV]: undefined }).siteId).toBeNull();
  });

  it("parses test mode into string true/false with a safe default", () => {
    expect(readTinyAdzConfig(OFF).testMode).toBe("true");
    expect(readTinyAdzConfig({ [TINYADZ_TEST_MODE_ENV]: "false" }).testMode).toBe("false");
    expect(readTinyAdzConfig({ [TINYADZ_TEST_MODE_ENV]: "0" }).testMode).toBe("false");
    expect(readTinyAdzConfig({ [TINYADZ_TEST_MODE_ENV]: "1" }).testMode).toBe("true");
    expect(readTinyAdzConfig({ [TINYADZ_TEST_MODE_ENV]: "junk" }).testMode).toBe("true");
  });

  it("exposes the exact publisher constants", () => {
    expect(TINYADZ_SCRIPT_URL).toBe("https://cdn.apitiny.net/scripts/v2.0/main.js");
    expect(TINYADZ_SCRIPT_ID).toBe("tinyadz-v2");
  });
});

describe("isTinyAdzEligiblePath", () => {
  it.each([
    ["/", true],
    ["/archivio", true],
    ["/archivio?q=ai", true],
    ["/toools/blink", true],
    ["/collections", true],
    ["/collections/top-ai", true],
    ["/posts", true],
    ["/posts/betterpic", true],
    ["/radar", true],
    ["/method", true],
    ["/shop", true],
    ["/chi-siamo", true],
    ["/account", false],
    ["/account/", false],
    ["/account/settings", false],
    ["/compare", false],
    ["/compare/blink-vs-other", false],
    ["/privacy", false],
    ["/termini", false],
    ["/cookie", false],
  ])("%s -> %s", (pathname, expected) => {
    expect(isTinyAdzEligiblePath(pathname)).toBe(expected);
  });

  it("returns false for missing pathnames", () => {
    expect(isTinyAdzEligiblePath(undefined)).toBe(false);
  });
});
