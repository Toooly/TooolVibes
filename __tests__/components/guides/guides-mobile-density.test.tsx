/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as localeModule from "@/components/i18n/locale-provider";

import { GuideTakeawaysDisclosure } from "@/components/guides/guide-callout";
import { GuideArticleHero } from "@/components/guides/guide-article-hero";
import { GuideCard } from "@/components/guides/guide-card";
import { GuideFeaturedSection } from "@/components/guides/guide-featured-section";
import { GuideMasthead } from "@/components/guides/guide-masthead";
import { GuideGridSection } from "@/components/guides/guide-grid-section";
import type { EditorialPostRecord } from "@/lib/types/article";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function makePost(overrides: Partial<EditorialPostRecord> = {}): EditorialPostRecord {
  return {
    slug: "frase-ai",
    title: "Frase AI, senza il rumore da SERP",
    dek: "Come usarla per decidere se vale il posto nel flusso editoriale, non per riempire un articolo.",
    summary: "Sintesi della guida.",
    kind: "guide",
    published_at: "2026-03-16T09:00:00.000Z",
    updated_at: "2026-04-01T09:00:00.000Z",
    source_label: "TooolVibes",
    source_url: "https://tooolvibes.com/posts/frase-ai",
    tool_slug: "frase-ai",
    tags: ["SEO"],
    highlights: [
      "Capisci quando Frase è lo strumento giusto",
      "Vedi il flusso di lavoro reale",
      "Esci con un criterio di no",
    ],
    details: [],
    cautions: [],
    content_markdown: "Parola ".repeat(500),
    ...overrides,
  };
}

describe("guides mobile density — index", () => {
  it("keeps featured as category, time, title, dek and one yellow CTA", () => {
    const post = makePost();
    const { container } = render(
      <GuideCard
        post={post}
        variant="feature"
        topic="SEO"
        toolName="Frase"
        toolHref="/toools/frase-ai"
        readMinutes={8}
      />,
    );

    expect(container.querySelector(".guides-feature__signal")?.textContent).toMatch(/SEO/);
    expect(container.querySelector(".guides-feature__signal")?.textContent).toMatch(/8 min/);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(post.title);
    expect(container.querySelector(".guides-feature__dek")?.textContent).toBe(post.dek);

    const primary = container.querySelector('.guides-feature__cta a[data-variant="primary"]');
    expect(primary?.textContent).toContain("Leggi la guida");
    expect(primary?.getAttribute("href")).toBe("/posts/frase-ai");

    const ghost = container.querySelector('.guides-feature__cta a[data-variant="ghost"]');
    expect(ghost?.textContent).toContain("Apri la scheda tool");
    expect(container.querySelector(".guides-feature__points")).toBeTruthy();
    expect(container.querySelector(".guides-feature__cover")).toBeTruthy();
  });

  it("labels the featured region from the real guide title without a duplicate heading panel", () => {
    const { container } = render(
      <GuideFeaturedSection
        post={makePost()}
        topicLabel="SEO"
        toolName="Frase"
        toolHref="/toools/frase-ai"
        readingMinutes={8}
      />,
    );

    const section = container.querySelector("#guides-featured");
    expect(section?.querySelector(".guides-section__head")).toBeNull();
    expect(section?.getAttribute("aria-labelledby")).toBe("guide-feature-frase-ai-title");
    expect(section?.querySelectorAll(".guides-kicker")).toHaveLength(1);
  });

  it("keeps the masthead title in the document for desktop", () => {
    render(
      <GuideMasthead />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText(/Guide scritte per/i)).toBeTruthy();
  });

  it("makes grid cards a single link with an accessible name instead of an extra Leggi control", () => {
    const post = makePost();
    const { container } = render(
      <GuideCard post={post} topic="SEO" readMinutes={8} />,
    );

    const link = screen.getByRole("link", { name: `Leggi la guida: ${post.title}` });
    expect(link.getAttribute("href")).toBe("/posts/frase-ai");
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector(".guides-card__cta")?.textContent).toBe("Leggi la guida");
    expect(container.querySelector(".guides-card__dek")).toBeTruthy();
  });

  it("filters the guide list and removes the unrelated featured card from filtered results", () => {
    render(<GuideGridSection initialVisible={1} featured={<p>Scelta editoriale</p>} topics={[{ label: "SEO", count: 2 }]} items={[
      { post: makePost(), topic: "SEO", readingMinutes: 8 },
      { post: makePost({ slug: "seconda-guida", title: "Seconda guida" }), topic: "SEO", readingMinutes: 6 },
      { post: makePost({ slug: "terza-guida", title: "Terza guida" }), topic: "Scrittura", readingMinutes: 5 },
    ]} />);

    expect(screen.getByRole("heading", { name: "Esplora le guide" }).id).toBe("guides-all-title");
    expect(screen.getByRole("status").textContent).toBe("1 di 3 guide");
    fireEvent.click(screen.getByRole("button", { name: "SEO 2" }));
    expect(screen.queryByText("Scelta editoriale")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("1 di 2 guide");
  });

  it("returns focus to the results heading after collapsing a long list", async () => {
    render(<GuideGridSection initialVisible={1} topics={[]} items={[
      { post: makePost(), topic: "SEO", readingMinutes: 8 },
      { post: makePost({ slug: "seconda-guida", title: "Seconda guida" }), topic: "SEO", readingMinutes: 6 },
    ]} />);

    fireEvent.click(screen.getByRole("button", { name: "Mostra tutte le 2 guide" }));
    expect(screen.getByRole("status").textContent).toBe("2 di 2 guide");
    fireEvent.click(screen.getByRole("button", { name: "Mostra meno guide" }));
    await waitFor(() => expect(document.activeElement?.id).toBe("guides-all-title"));
    expect(screen.queryByRole("link", { name: "Leggi la guida: Seconda guida" })).toBeNull();
  });

  it("keeps the featured guide reachable in its own topic without duplicating the all-guides teaser", () => {
    const { container } = render(<GuideGridSection initialVisible={6} featured={<GuideCard post={makePost()} topic="SEO" readMinutes={8} />}
      featuredItem={{ post: makePost(), topic: "SEO", readingMinutes: 8 }}
      topics={[{ label: "SEO", count: 2 }]} items={[
        { post: makePost({ slug: "seconda-guida", title: "Seconda guida" }), topic: "SEO", readingMinutes: 6 },
      ]} />);

    expect(container.querySelector(".guides-grid__featured-result a")?.getAttribute("href")).toBe("/posts/frase-ai");
    expect(container.querySelector('#guides-grid-list a[href="/posts/frase-ai"]')).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("2 di 2 guide");
    fireEvent.click(screen.getByRole("button", { name: "SEO 2" }));
    expect(screen.getByRole("link", { name: "Leggi la guida: Frase AI, senza il rumore da SERP" }).getAttribute("href")).toBe("/posts/frase-ai");
    expect(container.querySelector(".guides-grid__featured-result")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("2 di 2 guide");
    fireEvent.click(screen.getByRole("button", { name: "Tutte 2" }));
    expect(container.querySelector(".guides-grid__featured-result a")?.getAttribute("href")).toBe("/posts/frase-ai");
    expect(screen.getAllByRole("link", { name: "Leggi la guida: Frase AI, senza il rumore da SERP" })).toHaveLength(1);
  });

  it.each(["it", "en"] as const)("uses singular result copy in %s", (locale) => {
    vi.spyOn(localeModule, "useLocale").mockReturnValue({
      locale, preference: locale, pending: false, error: false,
      setPreference: () => {}, t: (value) => value, markdown: (value) => value,
    });
    render(<GuideGridSection topics={[]} items={[{ post: makePost(), topic: "SEO", readingMinutes: 8 }]} />);
    expect(screen.getByRole("status").textContent).toBe(locale === "en" ? "1 of 1 guide" : "1 di 1 guida");
  });
});

describe("guides mobile density — detail hero", () => {
  it("keeps topic and time pills and marks extra date pills", () => {
    render(
      <GuideArticleHero
        post={makePost()}
        readingMinutes={8}
        topicLabel="SEO"
      />,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Frase AI, senza il rumore da SERP",
    );
    expect(document.querySelector('[data-guide-pill="topic"]')?.textContent).toBe("SEO");
    expect(document.querySelector('[data-guide-pill="time"]')?.textContent).toMatch(/8 min/);
    expect(document.querySelector('[data-guide-pill="date"]')).toBeTruthy();
    expect(document.querySelector('[data-guide-pill="updated"]')).toBeTruthy();
    expect(document.querySelector(".pill--accent")?.textContent).toBe("Guida");
  });
});

describe("guides mobile density — takeaways", () => {
  it("wraps key takeaways in a closed details titled for later reading", () => {
    const items = ["Capisci il no", "Esci con un criterio"];
    const { container } = render(
      <GuideTakeawaysDisclosure title="Cosa otterrai da questa guida" items={items} />,
    );

    const details = container.querySelector("details.guides-takeaways-disclosure");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toBe(
      "Cosa trovi nella guida",
    );
    expect(screen.getByLabelText("Cosa otterrai da questa guida")).toBeTruthy();
    expect(screen.getByText("Capisci il no")).toBeTruthy();
  });

  it("renders nothing when highlights are empty", () => {
    const { container } = render(<GuideTakeawaysDisclosure items={[]} />);
    expect(container.querySelector("details")).toBeNull();
  });
});
