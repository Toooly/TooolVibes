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
    expect(html).toContain('method="post" action="/api/contact"');
    expect(html).toContain('type="submit" disabled');
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

  it("paces the same mobile explorer with native reversible scroll and manual controls", () => {
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(html.match(/class="journey__frame"/g)).toHaveLength(1);
    expect(html.match(/class="journey__track"/g)).toHaveLength(1);
    expect(css).toContain(".journey--guided .journey__frame { position: sticky;");
    expect(css).toContain("210svh");
    expect(app).toContain("frame.offsetHeight + stickyTop + cueSpace < availableHeight");
    expect(app).toContain("track.before(title)");
    expect(app).toContain("track.after(connection)");
    expect(css).toContain(".journey--compact .journey__visual");
    expect(app).toContain('description.setAttribute("aria-live", guided ? "off" : "polite")');
    expect(app).toContain("requestAnimationFrame(updateJourneyMotion)");
    expect(app).toContain("if (phase === activePhase) return");
    expect(app).not.toContain("currentTime");
    expect(app).not.toContain("getAnimations");
    expect(app).toContain('rail.style.setProperty("--method-progress", progress.toFixed(3))');
    expect(app).not.toContain('addEventListener("touchmove"');
    expect(app).not.toContain('addEventListener("wheel"');
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
    expect(css).toContain("detail-arrive .6s var(--ease) var(--detail-delay) both");
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
    expect(html).toContain('service-offer__amount">599</span> <span>€</span>');
    expect(html).toContain('service-offer__amount">600</span> <span>€</span> <small>/ 3 mesi</small>');
    expect(html).toContain('service-offer__amount">249</span> <span>€</span> <small class="service-offer__recurring">+ <strong>49 €</strong>/mese</small>');
    expect(html).toContain("consumi e integrazioni definiti nel preventivo");
    expect(html).toContain("3 mesi al prezzo di 1");
    expect(css).toContain("scene-frame");
    expect(html).not.toContain("IVA");
  });

  it("highlights compact final prices and explicit comparison amounts", () => {
    expect(css).toContain("--price-accent: #7cebb4");
    expect(css).toContain("--price-comparison: #eea0aa");
    expect(css).toContain("price-border-flow 4.8s");
    expect(html).not.toContain("Riferimento indicativo");
    expect(html.match(/<s>/g)).toHaveLength(3);
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain("white-space: nowrap");
    expect(html.match(/class="service-offer__amount"/g)).toHaveLength(3);
  });

  it("highlights service names in responsive accent pills, separate from promotions", () => {
    expect([...html.matchAll(/class="service-offer__label">([^<]+)<\/p>/g)].map((match) => match[1])).toEqual([
      "Sito web", "Automazione contenuti", "Attivazione chatbot",
    ]);
    const labelStyles = css.match(/\.service-offer__label \{([^}]+)\}/)?.[1];
    expect(labelStyles).toContain("width: fit-content");
    expect(labelStyles).toContain("max-width: 100%");
    expect(labelStyles).toContain("border-radius: 999px");
    expect(labelStyles).toContain("var(--service-accent)");
    expect(labelStyles).toContain("box-shadow:");
    expect(html).toContain('<p class="service-offer__promotion">3 mesi al prezzo di 1</p>');
  });

  it("removes the comparison-price accordion and its presentation", () => {
    expect(html).not.toContain("riferimenti-prezzi");
    expect(html).not.toContain("Come leggere i prezzi di confronto");
    expect(css).not.toContain(".price-reference");
  });

  it("places prices in a right column and keeps availability specific to each service", () => {
    expect(html.match(/class="service-offer__value"/g)).toHaveLength(3);
    expect(html.match(/class="service-capacity"/g)).toHaveLength(3);
    expect(html).toContain('data-available="1"');
    expect(html).toContain('data-available="3"');
    expect(html).toContain('data-available="request"');
    expect(html).toContain("1 sito disponibile su 5");
    expect(html).toContain("3 automazioni disponibili su 5");
    expect(html).toContain("Disponibilità su richiesta");
    expect(html.match(/class="service-capacity__note">Le richieste restano aperte\./g)).toHaveLength(3);
    expect(html).not.toContain("tra tutti i servizi");
    expect(html.match(/class="service-capacity__number" aria-hidden="true"/g)).toHaveLength(3);
    expect(html).toContain("<span>00</span><span>01</span><span>01</span>");
    expect(html).toContain("<span>00</span><span>02</span><span>03</span>");
    expect(html).not.toContain("<span>05</span>");
    expect(html.match(/class="is-assigned"/g)).toHaveLength(12);
    expect(html.match(/<a class="service-capacity" href="#contatti"/g)).toHaveLength(3);
    expect(css).not.toContain('@keyframes capacity-signal');
    expect(html).not.toMatch(/posti rimasti|scade tra|data-countdown/i);
    expect(css).toContain("container-type: inline-size");
    expect(css).toContain("grid-template-columns: minmax(0,1fr) auto");
  });

  it("shares one CTA interaction and animates the border and confirmed capacity without moving prices", () => {
    expect(css).toContain('.button:is(:hover,:focus-visible,:active):not(:disabled)::before { animation: control-sheen .75s');
    expect(css).not.toContain('animation: control-response');
    expect(css).not.toContain('.button--secondary:is(:hover,:focus-visible) svg');
    expect(css).toContain('.service-offer.is-in-view::after { animation: price-border-flow 4.8s ease-in-out infinite alternate');
    expect(css).toContain('mask-composite: exclude');
    expect(css).toContain('opacity: .85');
    expect(css).toContain('@keyframes capacity-count');
    expect(css).toContain('@keyframes capacity-tone');
    for (const animation of ['price-arrive', 'price-light', 'price-line', 'capacity-slot', 'capacity-arrive', 'capacity-orbit', 'capacity-response']) expect(css).not.toContain(`@keyframes ${animation}`);
    expect(css).not.toContain('.service-offer__price::before');
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain('querySelectorAll(".service-offer").forEach((element) => sceneObserver.observe(element))');
  });

  it("uses five native scarcity arcs and bounded neon surfaces without changing offer copy", () => {
    expect(html.match(/class="service-capacity__orbit"/g)).toHaveLength(2);
    expect(html.match(/<circle (?:class="is-assigned" )?cx="24" cy="24" r="21" pathLength="100"\/>/g)).toHaveLength(10);
    expect(css).toContain('.service-capacity__orbit circle.is-assigned');
    expect(css).toContain('@keyframes capacity-ring-status');
    expect(css).toContain('text-shadow: 0 0 1.2rem rgba(124,235,180,.16)');
    expect(css).not.toContain('.service-capacity__number::before');
    expect(css).toContain('.service-capacity small b { color: var(--capacity-accent,#f5ce8b); font-weight: 650; }');
  });

  it("provides a collapsible contact with three progressive steps", () => {
    expect(html).toContain('<details id="contatti" class="contact-panel" data-contact-panel>');
    expect(html.match(/data-form-step="[012]"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Passaggi della richiesta"');
    expect(html).toContain("data-step-next");
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain("contactPanel.open = true");
    expect(app).toContain("contactPanel.open = false");
    expect(app).toContain('link.closest("[data-service]")?.dataset.service');
    expect(app).toContain("invalid?.closest(\"[data-form-step]\")");
    expect(css).toContain(".contact-stage[hidden]");
  });

  it("animates native service screen interiors without extra controls or raster assets", () => {
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app.match(/class="service-screen"/g)).toHaveLength(3);
    expect(app).not.toContain("service-demo");
    expect(css).not.toContain(".service-visual__focus");
    expect(css).not.toContain("service-breathe");
    expect(html.match(/src="\/assets\/service-.*?-v2.webp"/g)).toHaveLength(3);
    expect(app).toContain('image.currentSrc || image.src');
    expect(app).toContain('source.addEventListener("error"');
    expect(app).toContain('loaded.size === sources.length');
    expect(app).not.toContain('<use href="#${id}-source"');
    expect(app).toContain('class="scene-layer"');
    expect(app).toContain('image.getAttribute("height")');
    expect(css).toContain("scene-depth 4.8s");
    expect(css).toContain("screen-signal 2.2s");
  });

  it("uses one reversible scroll-driven method with a readable reduced-motion fallback", () => {
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(html).toContain("data-method-track");
    expect(html.match(/class="method-browser"/g)).toHaveLength(1);
    expect(app).toContain('preference.addEventListener("change", syncMethodMotion)');
    expect(app).toContain('section.classList.toggle("method-ready", enabled)');
    expect(app).toContain("requestAnimationFrame(updateMethod)");
    expect(css).toContain(".method-ready .method-track { height: 340svh; min-height: 110rem; }");
  });

  it("guides form completion with inline errors and a message hint", () => {
    for (const field of ["name", "email", "message", "need", "privacyAccepted"]) expect(html).toContain(`id="${field}-error"`);
    expect(html).toContain("data-message-count");
    expect(html).toContain("Invia la richiesta");
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain("if (submitPending) return");
    expect(app).toContain('input.setAttribute("aria-invalid", "true")');
  });

  it("separates web and AI accents and normalizes section subtitles", () => {
    expect(css).toContain("--service-web: #6fa9ff");
    expect(css).toContain("--service-ai: #70e4af");
    expect(css).toContain("--subtitle-size:");
    expect(css).toContain("font-size: var(--subtitle-size)");
    expect(css).toContain("@keyframes control-sheen");
  });

  it("choreographs native preview details and starts service motion at the visual", () => {
    for (const animation of ["journey-portal-depth", "journey-post-arrive", "journey-chip", "journey-message", "journey-route", "screen-route"]) {
      expect(css).toContain(`@keyframes ${animation}`);
    }
    expect(html).not.toContain("service-visual__flow");
    expect(css).toContain(".service-visual.is-in-view .screen-reply");
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain('querySelectorAll("[data-service], .service-visual")');
    expect(app).toContain("journeyObserver.observe(track)");
  });
});
