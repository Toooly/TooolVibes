/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { GuideArticleToc } from "@/components/guides/guide-article-toc";
import { GuideMarkdown } from "@/components/guides/guide-markdown";

vi.mock("@/lib/shell/scroll-port", () => ({
  bindShellScroll: () => () => {},
  getShellScroller: () => window,
  readingLine: () => 0,
}));

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
});

it("keeps markdown headings and index links aligned, including repeated headings", async () => {
  const collect = vi.fn();
  render(
    <>
      <article data-guides-article-body>
        <GuideMarkdown content={"## Primo passo\n\nTesto.\n\n## Primo passo"} onHeadings={collect} />
      </article>
      <GuideArticleToc />
    </>,
  );
  await waitFor(() => expect(screen.getAllByRole("link", { name: "Primo passo" })).toHaveLength(2));
  const headings = screen.getAllByRole("heading", { name: "Primo passo" });
  expect(headings.map((heading) => heading.id)).toEqual(["primo-passo", "primo-passo-2"]);
  expect(screen.getAllByRole("link", { name: "Primo passo" }).map((link) => link.getAttribute("href")))
    .toEqual(headings.map((heading) => `#${heading.id}`));
});

it("links to the actual heading ids without depending on server sibling render order", async () => {
  render(
    <>
      <article data-guides-article-body>
        <h2 id="prima-sezione">Prima sezione</h2>
        <h3 id="prima-sezione-2">Prima sezione, altro contesto</h3>
      </article>
      <GuideArticleToc />
    </>,
  );
  await waitFor(() => expect(screen.getByRole("link", { name: "Prima sezione" }).getAttribute("href")).toBe("#prima-sezione"));
  expect(screen.getByRole("link", { name: "Prima sezione, altro contesto" }).getAttribute("href")).toBe("#prima-sezione-2");
});

it("excludes locked preview headings and updates when the reading surface opens", async () => {
  const { container } = render(
    <>
      <article data-guides-article-body>
        <div aria-hidden="true"><h2 id="riservata">Sezione riservata</h2></div>
      </article>
      <GuideArticleToc />
    </>,
  );
  expect(screen.queryByRole("link", { name: "Sezione riservata" })).toBeNull();
  container.querySelector("[aria-hidden]")!.removeAttribute("aria-hidden");
  await waitFor(() => expect(screen.getByRole("link", { name: "Sezione riservata" }).getAttribute("href")).toBe("#riservata"));
});
