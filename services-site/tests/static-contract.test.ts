import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "services-site/public");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");

describe("TooolVibes Servizi static contract", () => {
  it("has independent canonical and social metadata", () => {
    expect(html).toContain('href="https://servizi.tooolvibes.eu/"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('type="application/ld+json"');
  });

  it("contains no navigation to the main TooolVibes platform", () => {
    expect(html).not.toMatch(/href=["']https:\/\/tooolvibes\.eu/i);
    expect(html).not.toMatch(/href=["']\/(archivio|radar|account|compare|shop)/i);
  });

  it("contains the complete accessible lead form", () => {
    for (const name of ["name", "email", "company", "need", "message", "privacyAccepted"]) {
      expect(html).toContain(`name="${name}"`);
    }
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("provides visible focus, reduced motion and mobile adaptations", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@media (max-width: 48rem)");
  });

  it("provides one responsive service explorer in the requested service order", () => {
    expect(html.match(/data-journey-select="(web|social|ai)"/g)).toEqual([
      'data-journey-select="web"',
      'data-journey-select="social"',
      'data-journey-select="ai"',
    ]);
    expect(html.match(/id="journey-preview"/g)).toHaveLength(1);
    for (const target of ["servizi", "contenuti", "chatbot"]) {
      expect(html).toContain(`id="${target}"`);
      expect(html).toContain(`href="#${target}"`);
    }
    expect(html).toContain('<noscript><nav class="journey__fallback"');
    expect(html).not.toContain('class="hero-orbit"');
  });

  it("uses the top explorer without a second ecosystem section", () => {
    expect(html).toContain('id="esplora"');
    expect(html).toContain('class="button button--secondary" href="#esplora"');
    expect(html).not.toContain('id="ecosistema"');
    expect(css).not.toContain(".ecosystem");
  });

  it("animates secondary details without brighter markers or perpetual motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("detail-arrive .6s");
    expect(css).toContain("detail-signal 1.6s ease-in-out var(--detail-delay) 2");
    const marker = css.match(/\.plain-list li::before \{([^}]+)\}/)?.[1];
    expect(marker).toContain("width: .2rem");
    expect(marker).not.toContain("box-shadow");
    expect(marker).toContain("var(--ink-muted)");
  });

  it("shows service-specific prices with genuine contact links", () => {
    for (const service of ["web", "social", "ai"]) {
      expect(html).toContain(`data-service-price="${service}"`);
    }
    expect(html).toContain("Riferimento indicativo <span>1.299 €</span>");
    expect(html).not.toContain("998 €");
    expect(html).toContain("Tre mesi a prezzo ordinario <s>1.800 €</s>");
    expect(html).toContain('599 <span>€</span>');
    expect(html).toContain('600 <span>€</span> <small>/ 3 mesi</small>');
    expect(html).toContain('249 <span>€</span> <small>attivazione</small>');
    expect(html).toContain('+ <strong>49 €</strong> / mese di gestione');
    expect(html).toContain("consumi e integrazioni definiti nel preventivo");
    expect(html).toContain("3 mesi al prezzo di 1");
    expect(css).toContain("service-depth-in");
    expect(html).toContain("600 € complessivi per tre mesi");
    expect(html).not.toContain("IVA");
  });

  it("highlights final prices without inventing historical discounts", () => {
    expect(css).toContain("--price-accent: #7cebb4");
    expect(css).toContain("--price-comparison: #eea0aa");
    expect(css).toContain("price-arrive .9s");
    expect(css).toContain("price-light 2.4s");
    expect(html).not.toContain("<s>1.299 €</s>");
    expect(html.match(/<s>/g)).toHaveLength(1);
  });

  it("choreographs native preview details and starts service motion at the visual", () => {
    for (const animation of ["journey-portal-depth", "journey-post-arrive", "journey-chip", "journey-message", "journey-route", "service-flow"]) {
      expect(css).toContain(`@keyframes ${animation}`);
    }
    expect(html.match(/class="service-visual__flow"/g)).toHaveLength(3);
    expect(css).toContain(".service-visual.is-in-view .service-visual__pulse");
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain('querySelectorAll("[data-service], .service-visual")');
    expect(app).toContain('journeyObserver.observe(journey.querySelector(".journey__visual"))');
  });
});
