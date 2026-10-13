import { afterEach, describe, expect, it, vi } from "vitest";
import { navigateSite, needsDocumentNavigation } from "@/lib/shell/document-navigation";

afterEach(() => vi.unstubAllGlobals());

describe("document navigation", () => {
  it.each(["/archivio", "/radar?r=week#signals", "/toools/blink"])("loads a fresh document for another page: %s", href => {
    expect(needsDocumentNavigation(href, "https://tooolvibes.eu/")).toBe(true);
  });
  it.each(["?q=ai", "#guide", "/archivio?q=ai"])("keeps in-page state for %s", href => {
    expect(needsDocumentNavigation(href, "https://tooolvibes.eu/archivio")).toBe(false);
  });
  it.each(["https://example.com/", "mailto:hello@example.com", "http://["])("does not hijack external or malformed hrefs: %s", href => {
    expect(needsDocumentNavigation(href, "https://tooolvibes.eu/")).toBe(false);
  });
  it("preserves query and fragment when loading a new page", () => {
    const assign = vi.fn(), router = { push: vi.fn(), replace: vi.fn() };
    vi.stubGlobal("window", { location: { href: "https://tooolvibes.eu/", assign } });
    navigateSite("/account?view=salvati#tools", router);
    expect(assign).toHaveBeenCalledWith("https://tooolvibes.eu/account?view=salvati#tools");
    expect(router.push).not.toHaveBeenCalled();
  });
  it("preserves replace semantics and in-page routing", () => {
    const replace = vi.fn(), router = { push: vi.fn(), replace: vi.fn() };
    vi.stubGlobal("window", { location: { href: "https://tooolvibes.eu/account", replace } });
    navigateSite("/radar", router, true);
    expect(replace).toHaveBeenCalledWith("https://tooolvibes.eu/radar");
    navigateSite("/account?view=salvati", router, true);
    expect(router.replace).toHaveBeenCalledWith("/account?view=salvati");
  });
});
