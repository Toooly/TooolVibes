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

  it("shows service-specific prices with genuine contact links", () => {
    for (const service of ["web", "social", "ai"]) {
      expect(html).toContain(`data-service-price="${service}"`);
    }
    expect(html).toContain("Riferimento indicativo <span>1.299 €</span>");
    expect(html).toContain("Riferimento indicativo <span>998 €</span>");
    expect(html).toContain("Tre mesi a prezzo ordinario <s>1.800 €</s>");
    expect(html).toContain('599 <span>€</span>');
    expect(html).toContain('600 <span>€</span> <small>/ 3 mesi</small>');
    expect(html).toContain('499 <span>€</span>');
    expect(html).toContain("3 mesi al prezzo di 1");
    expect(css).toContain("service-depth-in");
    expect(html).toContain("600 € complessivi per tre mesi");
    expect(html).not.toContain("IVA");
  });
});
