// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToReadableStream } from "react-dom/server.browser";
import { LocalizedAttributes } from "@/components/i18n/localized-text";

vi.mock("@/components/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (source: string) => source === "Cerca" ? "Search" : source }),
}));
afterEach(cleanup);

describe("LocalizedAttributes", () => {
  it("keeps normal attribute translation and forwarded events", () => {
    const child = vi.fn();
    const parent = vi.fn();
    render(<LocalizedAttributes onClick={parent}><button aria-label="Cerca" onClick={child}>Search</button></LocalizedAttributes>);
    screen.getByRole("button", { name: "Search" }).click();
    expect(child).toHaveBeenCalledOnce();
    expect(parent).toHaveBeenCalledOnce();
  });

  it("preserves collections and empty server content without reading element props", () => {
    render(<LocalizedAttributes>{[null, <p key="body">Guide content</p>]}</LocalizedAttributes>);
    expect(screen.getByText("Guide content")).toBeTruthy();
  });

  it("lets React resolve asynchronous server content during prerendering", async () => {
    const content = Promise.resolve(<p>Resolved guide content</p>);
    const stream = await renderToReadableStream(<Suspense fallback={<p>Loading</p>}><LocalizedAttributes>{content}</LocalizedAttributes></Suspense>);
    await stream.allReady;
    const html = await new Response(stream).text();
    expect(html).toContain("Resolved guide content");
  });
});
