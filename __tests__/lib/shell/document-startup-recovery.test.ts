import { beforeEach, describe, expect, it, vi } from "vitest";
import { documentStartupRecoveryScript, DOCUMENT_RECOVERY_QUERY } from "@/lib/shell/document-startup-recovery";

describe("pre-hydration document recovery", () => {
  let listener: (event: { target: object }) => void;
  let storage: Map<string, string>;
  let dataset: Record<string, string>;
  const reload = vi.fn(), replace = vi.fn();
  const install = (href = "https://tooolvibes.eu/archivio?q=ai#tools", blockedStorage = false) => {
    const location = { href, origin: new URL(href).origin, reload, replace };
    const window = { location, addEventListener: (_: string, callback: typeof listener) => { listener = callback; } };
    const sessionStorage = {
      getItem: (key: string) => { if (blockedStorage) throw new Error("Blocked"); return storage.get(key) ?? null; },
      setItem: (key: string, value: string) => storage.set(key, value),
    };
    new Function("window", "document", "sessionStorage", documentStartupRecoveryScript("release-one"))(
      window, { documentElement: { dataset } }, sessionStorage,
    );
  };
  const fail = (src = "https://tooolvibes.eu/_next/static/chunks/app/archivio/page.js") => {
    listener({ target: { tagName: "SCRIPT", src } });
  };
  beforeEach(() => { storage = new Map(); dataset = {}; reload.mockClear(); replace.mockClear(); });

  it("runs its serialized script without external dependencies and retries only once", () => {
    install(); fail(); fail();
    expect(reload).toHaveBeenCalledTimes(1);
    install(); fail();
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("allows a separate destination to recover", () => {
    install(); fail();
    install("https://tooolvibes.eu/radar"); fail();
    expect(reload).toHaveBeenCalledTimes(2);
  });
  it("ignores unrelated assets, runtime exceptions, and failures after hydration", () => {
    install();
    fail("https://cdn.example.com/_next/static/chunk.js");
    fail("https://tooolvibes.eu/logo.svg");
    listener({ target: {} });
    dataset.tvDocumentReady = "true"; fail();
    expect(reload).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
  it("bounds recovery without browser storage and retains destination, query, and hash", () => {
    install(undefined, true); fail();
    const retried = new URL(replace.mock.calls[0][0]);
    expect(retried.pathname).toBe("/archivio");
    expect(retried.searchParams.get("q")).toBe("ai");
    expect(retried.hash).toBe("#tools");
    expect(retried.searchParams.get(DOCUMENT_RECOVERY_QUERY)).toBe("release-one");
    install(retried.href, true); fail();
    expect(replace).toHaveBeenCalledTimes(1);
  });
  it("escapes inline script terminators in release identifiers", () => {
    expect(documentStartupRecoveryScript("</script>")).not.toContain("</script>");
  });
});
