/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CollectionSectionNavV4 } from "@/components/collections/collection-section-nav-v4";
import { GuideArticleToc } from "@/components/guides/guide-article-toc";
import { scrollToSection } from "@/lib/shell/scroll-port";

vi.mock("@/lib/shell/scroll-port", () => ({
  readingLine: () => 80,
  scrollToSection: vi.fn(),
  bindShellScroll: () => () => {},
  getShellScroller: () => window,
}));
vi.mock("@/lib/hooks/use-reduced-motion", () => ({ useReducedMotion: () => true }));
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  HTMLElement.prototype.scrollTo = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
});
afterEach(cleanup);
const sections = [{ id: "stack", label: "Stack" }, { id: "variants", label: "Varianti" }, { id: "decision", label: "Decisioni" }];

it("turns locked stack sections into a single usable access destination and restores them when unlocked", async () => {
  const { container } = render(<main>
    <CollectionSectionNavV4 items={sections} />
    <section id="stack">Stack</section>
    <section className="tv-member-gate"><h2 id="tv-member-gate-title">Accedi</h2>
      <div inert><details id="variants"><summary>Versioni</summary>Contenuto</details><section id="decision">Decisioni</section></div>
    </section>
  </main>);
  await waitFor(() => expect(screen.getByRole("link", { name: "Continua nel tuo spazio" }).getAttribute("href")).toBe("#tv-member-gate-title"));
  expect(screen.queryByRole("link", { name: "Varianti" })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Continua nel tuo spazio" }));
  expect(document.activeElement?.id).toBe("tv-member-gate-title");
  container.querySelector("[inert]")!.removeAttribute("inert");
  await waitFor(() => expect(screen.getByRole("link", { name: "Varianti" })).toBeTruthy());
  fireEvent.click(screen.getByRole("link", { name: "Varianti" }));
  expect((container.querySelector("details") as HTMLDetailsElement).open).toBe(true);
  expect(window.location.hash).toBe("#variants");
  expect(scrollToSection).toHaveBeenLastCalledWith(container.querySelector("details"), "auto");
});

it("opens nested disclosure targets and allows repeat taps on the same anchor", async () => {
  const { container } = render(<main><CollectionSectionNavV4 items={sections} />
    <section id="stack" /><details><summary>Outer</summary><details id="variants"><summary>Inner</summary>Body</details></details><section id="decision" />
  </main>);
  fireEvent.click(screen.getByRole("link", { name: "Varianti" }));
  expect([...container.querySelectorAll("details")].every((item) => item.open)).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: "Varianti" }));
  expect(scrollToSection).toHaveBeenCalledTimes(2);
});

it("refreshes guide index text when the rendered language changes without changing heading ids", async () => {
  const { container } = render(<main><article data-guides-article-body><h2 id="stable">Titolo italiano</h2></article><GuideArticleToc /></main>);
  await waitFor(() => expect(screen.getByRole("link", { name: "Titolo italiano" })).toBeTruthy());
  container.querySelector("h2")!.firstChild!.nodeValue = "English heading";
  await waitFor(() => expect(screen.getByRole("link", { name: "English heading" }).getAttribute("href")).toBe("#stable"));
});

it("honors a deep link when its reading target mounts after the navigation", async () => {
  window.history.replaceState(null, "", "/#variants");
  const { rerender, container } = render(<main><CollectionSectionNavV4 items={sections} /><section id="stack" /></main>);
  rerender(<main><CollectionSectionNavV4 items={sections} /><section id="stack" /><details id="variants"><summary>Versioni</summary>Contenuto</details><section id="decision" /></main>);
  await waitFor(() => expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(true));
  expect(scrollToSection).toHaveBeenCalled();
});

it("keeps the selected section active at a fractional scroll boundary", async () => {
  const { container } = render(<main><CollectionSectionNavV4 items={sections} /><section id="stack" /><section id="variants" /><section id="decision" /></main>);
  for (const [id, top] of [['stack', -100], ['variants', 80.5], ['decision', 600]] as const) {
    vi.spyOn(container.querySelector(`#${id}`)!, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
  }
  fireEvent.scroll(document);
  await waitFor(() => expect(screen.getByRole('link', { name: 'Varianti' }).getAttribute('aria-current')).toBe('location'));
});
