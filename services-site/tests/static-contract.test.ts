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

  it("composes the hero on two lines with restrained orbital service indices", () => {
    expect(html.match(/class="hero__title-line"/g)).toHaveLength(2);
    expect(html).toContain("Il digitale, costruito</span>");
    expect(html.match(/class="journey__index" aria-hidden="true">[123]<\/span>/g)).toHaveLength(3);
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("@keyframes index-orbit");
    expect(css).toContain("@keyframes control-sheen");
    expect(css).toContain(".button:disabled::before { display: none; }");
  });

  it("animates benefit icons without bullets or perpetual motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("detail-arrive .6s");
    expect(css).toContain("detail-signal 1.6s ease-in-out var(--detail-delay) 2");
    expect(css).toContain(".service.is-in-view .service-benefits svg");
    expect(css).not.toContain(".plain-list");
    expect(css).not.toContain(".flow-legend");
  });

  it("uses the exact requested benefit lists with decorative native icons", () => {
    const expected = [
      ["Restyling siti web", "Design responsive", "Prenotazioni online", "Ottimizzazione SEO", "Integrazione WhatsApp", "Moduli di acquisizione contatti", "Manutenzione e assistenza"],
      ["Identità professionale", "Contenuti automatici", "Social sempre attivi", "Tempo risparmiato"],
      ["Risposte immediate", "Assistenza 24/7", "Nuovi contatti", "Prenotazioni automatiche", "Follow-up intelligenti"],
    ];
    const lists = [...html.matchAll(/<ul class="service-benefits"[^>]*>([\s\S]*?)<\/ul>/g)];
    expect(lists).toHaveLength(3);
    lists.forEach((list, index) => {
      expect([...list[1].matchAll(/<span>([^<]+)<\/span>/g)].map((match) => match[1])).toEqual(expected[index]);
      expect(list[1].match(/<svg aria-hidden="true"/g)).toHaveLength(expected[index].length);
    });
    expect(html).not.toContain('class="plain-list"');
    expect(html).not.toContain('class="flow-legend"');
  });

  it("shows service-specific prices with genuine contact links", () => {
    for (const service of ["web", "social", "ai"]) {
      expect(html).toContain(`data-service-price="${service}"`);
    }
    expect(html).toContain("Anziché <s>1.299 €</s>");
    expect(html).not.toContain("998 €");
    expect(html).toContain("Anziché <s>1.800 €</s>");
    expect(html).toContain("Anziché <s>499 € + 79 €/mese</s>");
    expect(html).toContain('599 <span>€</span>');
    expect(html).toContain('600 <span>€</span> <small>/ 3 mesi</small>');
    expect(html).toContain('249 <span>€</span> <small class="service-offer__recurring">+ <strong>49 €</strong>/mese</small>');
    expect(html).toContain("consumi e integrazioni definiti nel preventivo");
    expect(html).toContain("3 mesi al prezzo di 1");
    expect(css).toContain("service-depth-in");
    expect(html).toContain("600 € complessivi per tre mesi");
    expect(html).not.toContain("IVA");
  });

  it("highlights compact final prices and explicit comparison amounts", () => {
    expect(css).toContain("--price-accent: #7cebb4");
    expect(css).toContain("--price-comparison: #eea0aa");
    expect(css).toContain("price-arrive .9s");
    expect(css).toContain("price-light 2.4s");
    expect(html).not.toContain("Riferimento indicativo");
    expect(html.match(/<s>/g)).toHaveLength(3);
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain("white-space: nowrap");
  });

  it("separates web and AI accents and normalizes section subtitles", () => {
    expect(css).toContain("--service-web: #6fa9ff");
    expect(css).toContain("--service-ai: #70e4af");
    expect(css).toContain("--subtitle-size:");
    expect(css).toContain("font-size: var(--subtitle-size)");
    expect(css).toContain("@keyframes control-response");
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
