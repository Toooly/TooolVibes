/**
 * @vitest-environment jsdom
 *
 * CTA contract tests (spec §26).
 *
 * The physical review found external Product Hunt tools offering "Vedi nel
 * Catalogo" and navigating to a Catalogo page where the tool does not exist.
 * These tests pin the corrected contract so that can never regress.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RadarQuickPreview } from "@/components/radar/radar-quick-preview";
import { RadarToolRow } from "@/components/radar/radar-tool-row";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { deriveRadarTopicCluster } from "@/lib/radar/radar-topic-clusters";

vi.mock("@/components/tools/compare-toggle", () => ({
  CompareToggle: ({ slug }: { slug: string }) => (
    <button type="button" data-testid="compare-toggle" data-slug={slug}>
      Compare
    </button>
  ),
}));
vi.mock("@/components/tools/shortlist-toggle", () => ({
  ShortlistToggle: ({ slug }: { slug: string }) => (
    <button type="button" data-testid="save-toggle" data-slug={slug}>
      Save
    </button>
  ),
}));

function tool(overrides: Partial<RadarTool> & { id: string }): RadarTool {
  const topics = overrides.topics ?? ["Developer Tools"];
  return {
    name: "Tool",
    tagline: "Tagline",
    sourceUrl: "https://www.producthunt.com/posts/x",
    productHuntUrl: "https://www.producthunt.com/posts/x",
    websiteUrl: null,
    thumbnailUrl: null,
    votesCount: 10,
    commentsCount: 2,
    attention: 12,
    launchedAt: "2026-10-05T07:00:00.000Z",
    ageHours: 6,
    topics,
    catalogStatus: "external",
    category: null,
    categoryLabel: null,
    catalogSlug: null,
    topicCluster: deriveRadarTopicCluster(topics),
    rank: 1,
    ...overrides,
  };
}

const EXTERNAL = tool({ id: "ext-1", name: "Incredible" });
const EXTERNAL_WITH_SITE = tool({
  id: "ext-2",
  name: "Incredible",
  websiteUrl: "https://incredible.example",
});
const LINKED = tool({
  id: "linked-1",
  name: "Blink",
  catalogStatus: "linked",
  catalogSlug: "blink",
});

function renderPreview(target: RadarTool) {
  return render(
    <RadarQuickPreview
      tool={target}
      onClose={() => {}}
      historyAvailable={false}
      watched={false}
      onToggleWatch={() => {}}
    />,
  );
}

afterEach(() => cleanup());

describe("RADAR-CTA external signal contract", () => {
  it("RADAR-CTA-EXT-01 offers no catalog navigation at all", () => {
    const { container } = renderPreview(EXTERNAL);
    const links = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(links).not.toContain("/archivio");
    expect(links.some((href) => href?.startsWith("/toools/"))).toBe(false);
    expect(screen.queryByText(/Vedi nel Catalogo/i)).toBeNull();
    expect(screen.queryByText(/Apri scheda/i)).toBeNull();
  });

  it("RADAR-CTA-EXT-02 offers no Save and no Compare", () => {
    renderPreview(EXTERNAL);
    expect(screen.queryByTestId("save-toggle")).toBeNull();
    expect(screen.queryByTestId("compare-toggle")).toBeNull();
  });

  it("RADAR-CTA-EXT-03 exposes the source CTA and Watch", () => {
    renderPreview(EXTERNAL);
    const source = screen.getByText(/Apri la fonte/i).closest("a");
    expect(source?.getAttribute("href")).toBe(EXTERNAL.sourceUrl);
    expect(source?.getAttribute("target")).toBe("_blank");
    expect(source?.getAttribute("rel")).toContain("noopener");
    expect(source?.getAttribute("rel")).toContain("noreferrer");
    expect(screen.getByText(/Segui nel Radar/i)).toBeTruthy();
  });

  it("RADAR-CTA-EXT-04 the website is primary when the source provides one", () => {
    renderPreview(EXTERNAL_WITH_SITE);
    const primary = screen.getByText(/Visita il sito/i).closest("a");
    expect(primary?.getAttribute("href")).toBe("https://incredible.example");
    expect(primary?.getAttribute("target")).toBe("_blank");
    // The source stays available as the secondary action. Its label appears
    // both in the source-transparency block and as the secondary CTA.
    expect(screen.getAllByText(/Product Hunt/i).length).toBeGreaterThan(0);
  });

  it("RADAR-CTA-EXT-05 the signal is labelled as external", () => {
    renderPreview(EXTERNAL);
    expect(screen.getByText(/Segnale esterno/i)).toBeTruthy();
    expect(screen.queryByText(/Nel Catalogo TooolVibes/i)).toBeNull();
  });

  it("RADAR-CTA-EXT-06 the list row matches the preview contract", () => {
    render(
      <ul>
        <RadarToolRow
          tool={EXTERNAL}
          index={0}
          selected={false}
          onSelect={() => {}}
          watched={false}
          onToggleWatch={() => {}}
        />
      </ul>,
    );
    expect(screen.queryByTestId("save-toggle")).toBeNull();
    expect(screen.queryByTestId("compare-toggle")).toBeNull();
    expect(screen.queryByText(/^Scheda$/)).toBeNull();
    expect(screen.getByText(/^Fonte$/)).toBeTruthy();
    expect(screen.getByLabelText(/Segui Incredible nel Radar/i)).toBeTruthy();
  });
});

describe("RADAR-CTA catalog-linked signal contract", () => {
  it("RADAR-CTA-LINK-01 links to the exact Tool Detail route only", () => {
    const { container } = renderPreview(LINKED);
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/toools/blink");
    expect(hrefs).not.toContain("/archivio");
    expect(screen.getByText(/Apri scheda/i)).toBeTruthy();
  });

  it("RADAR-CTA-LINK-02 exposes Save and Compare on the canonical slug", () => {
    renderPreview(LINKED);
    expect(screen.getByTestId("save-toggle").getAttribute("data-slug")).toBe("blink");
    expect(screen.getByTestId("compare-toggle").getAttribute("data-slug")).toBe("blink");
  });

  it("RADAR-CTA-LINK-03 Watch is available and the signal is labelled as catalog", () => {
    renderPreview(LINKED);
    expect(screen.getByText(/Segui nel Radar/i)).toBeTruthy();
    expect(screen.getByText(/Nel Catalogo TooolVibes/i)).toBeTruthy();
    expect(screen.queryByText(/Segnale esterno/i)).toBeNull();
  });

  it("RADAR-CTA-LINK-04 the list row matches the preview contract", () => {
    render(
      <ul>
        <RadarToolRow
          tool={LINKED}
          index={0}
          selected={false}
          onSelect={() => {}}
          watched={false}
          onToggleWatch={() => {}}
        />
      </ul>,
    );
    expect(screen.getByTestId("save-toggle")).toBeTruthy();
    expect(screen.getByTestId("compare-toggle")).toBeTruthy();
    expect(screen.getByText(/^Scheda$/)).toBeTruthy();
    expect(screen.queryByText(/^Fonte$/)).toBeNull();
  });
});

describe("RADAR-CTA source transparency", () => {
  it("RADAR-CTA-SRC-01 exposes area, source and topics for explainability", () => {
    renderPreview(tool({ id: "src", topics: ["Developer Tools", "Artificial Intelligence"] }));
    expect(screen.getByText("Area")).toBeTruthy();
    // The area is stated in the header AND in the explainable position block.
    expect(screen.getAllByText("Sviluppo & Coding").length).toBeGreaterThan(0);
    // Source transparency block: label + real source topics.
    expect(screen.getByText("Fonte")).toBeTruthy();
    expect(screen.getAllByText(/Developer Tools/).length).toBeGreaterThan(0);
  });

  it("RADAR-CTA-SRC-02 position is explainable without a hidden score", () => {
    renderPreview(tool({ id: "pos", votesCount: 842, commentsCount: 96 }));
    expect(screen.getByText(/Emerso/i)).toBeTruthy();
    expect(screen.getByText(/842 voti · 96 commenti/)).toBeTruthy();
    expect(screen.queryByText(/score/i)).toBeNull();
  });

  it("controls a unique details region for each inspector", () => {
    renderPreview(EXTERNAL);
    renderPreview(LINKED);
    const toggles = screen.getAllByRole("button", { name: "Dettagli completi" });
    const ids = toggles.map(toggle => toggle.getAttribute("aria-controls"));
    expect(new Set(ids).size).toBe(2);
    for (const toggle of toggles) {
      expect(document.getElementById(toggle.getAttribute("aria-controls")!)?.querySelector(".tv-rx-preview__metrics")).toBeTruthy();
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
    }
  });

  it("RADAR-CTA-WATCH-01 toggling Watch reports state", () => {
    const onToggleWatch = vi.fn();
    render(
      <RadarQuickPreview
        tool={EXTERNAL}
        onClose={() => {}}
        historyAvailable={false}
        watched
        onToggleWatch={onToggleWatch}
      />,
    );
    const button = screen.getByRole("button", { name: /Seguito/i });
    fireEvent.click(button);
    expect(onToggleWatch).toHaveBeenCalledTimes(1);
  });
});


describe("Radar contextual inspection", () => {
  it("expands details without changing the canonical actions", () => {
    renderPreview(LINKED);
    const expand = screen.getByRole("button", { name: "Dettagli completi" });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expand);
    expect(screen.getByRole("button", { name: "Riduci dettagli" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Apri scheda" }).getAttribute("href")).toBe("/toools/blink");
    expect(screen.getByTestId("save-toggle").getAttribute("data-slug")).toBe("blink");
    expect(screen.getByTestId("compare-toggle").getAttribute("data-slug")).toBe("blink");
    fireEvent.click(screen.getByRole("button", { name: "Riduci dettagli" }));
    expect(screen.getByRole("button", { name: "Dettagli completi" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("replaces an unavailable thumbnail without removing tool identity", () => {
    const { container } = renderPreview(tool({ id: "image-failure", name: "Incredible", thumbnailUrl: "https://example.test/missing.png" }));
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".tv-rx-preview__logo--fallback")?.textContent).toBe("IN");
    expect(screen.getByRole("heading", { name: "Incredible" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Segui nel Radar" })).toBeTruthy();
  });
});
