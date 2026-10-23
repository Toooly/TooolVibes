import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "services-site/public");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");
const app = readFileSync(resolve(root, "app.js"), "utf8");

describe("TooolVibes Servizi static contract", () => {
  it("does not paint the light skip-link offscreen until it receives keyboard focus", () => {
    const hidden = css.match(/\.skip-link \{([^}]+)\}/)![1];
    const focused = css.match(/\.skip-link:focus \{([^}]+)\}/)![1];
    expect(hidden).toContain("opacity: 0");
    expect(hidden).toContain("clip-path: inset(50%)");
    expect(hidden).toContain("pointer-events: none");
    expect(focused).toContain("opacity: 1");
    expect(focused).toContain("clip-path: none");
    expect(focused).toContain("pointer-events: auto");
  });

  it("sends a short native neon trail through two responsive hairpins instead of opening a spotlight", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*@supports \(animation-timeline: scroll\(\)\)/);
    expect(css).not.toContain(".hero::after");
    expect(css).not.toContain("intro-light-focus");
    expect(css).toContain("animation-range: 0px var(--intro-travel,560px)");
    expect(css).toContain("stroke-dasharray: var(--trail-length) 1600");
    expect(css).toContain("stroke-dashoffset: calc(var(--trail-length) - 1000px)");
    expect(css).not.toContain("1190px");
    expect(css).toContain("100% { offset-distance: 100%; opacity: 0; }");
    expect(html).toContain('data-intro-trail aria-hidden="true"');
    expect(html).toContain('data-intro-route pathLength="1000"');
    expect(html.match(/<use class="intro-trail__/g)).toHaveLength(22);
    expect(app).toContain("function initIntroTrail()");
    expect(app).toContain('spot.style.offsetPath =');
  });

  it("hands a multi-filament beam from the hero CTAs into the explorer without adding vertical space", () => {
    expect(html.match(/intro-trail__filament--(?:cyan|violet)/g)).toHaveLength(4);
    expect(css).toContain("--trail-length: 140px; stroke: var(--cyan); stroke-width: .75px;");
    expect(css).toContain("@keyframes intro-trail-wake");
    expect(css).toContain("animation-range: var(--intro-primary-from) var(--intro-primary-to)");
    expect(css).toContain("animation-range: var(--intro-secondary-from) var(--intro-secondary-to)");
    expect(css).toContain("animation: intro-primary-cue linear;");
    expect(css).toContain("animation: intro-secondary-cue linear;");
    expect(html).toContain('class="journey__arrival" aria-hidden="true"');
    expect(css).toContain(".journey__arrival { position: absolute;");
    expect(app).toContain("function buildTrailBundle(");
    expect(app).toContain('root.classList.add("intro-guided")');
    expect(app).toContain('root.classList.remove("intro-guided")');
  });

  it("reuses the neon trail once on contact arrival without distracting while typing", () => {
    expect(html).toContain('data-contact-trail aria-hidden="true"');
    expect(html).toContain('data-contact-route pathLength="1000"');
    expect(css).toContain(".contact-trail.is-playing :is(use,.intro-trail__filament) { animation: intro-trail-pass 1.85s cubic-bezier(.32,.04,.24,1) both; }");
    expect(app).toContain("function initContactTrail()");
    expect(app).toContain('section.addEventListener("focusin", onFocus)');
    expect(app).toContain('if (event.target.classList.contains("intro-trail__head")) stop();');
  });


  it("lets the header leave with native scrolling without reserving its old fixed space", () => {
    expect(css.match(/\.site-header \{([^}]+)\}/)![1]).toContain("position: absolute");
    expect(css).not.toContain(".site-header.is-scrolled");
    expect(css).toContain("scroll-padding-top: 1rem");
    expect(css).toContain("justify-self: start; margin-left: 0;");
    expect(app).not.toContain("syncHeader");
    expect(app).toContain("stickyTop = 12;");
    expect(app).toContain("const top = 16;");
  });

  it("keeps the animated header mark compact and removes the old hero spacer", () => {
    expect(css).toContain(".brand-signal { width: min(100%,14rem); min-width: 0; height: 3rem;");
    expect(css).toContain(".brand-signal { width: 100%; }");
    expect(css).toContain(".brand-signal__field img { width: 2.5rem; height: 2.5rem; }");
    expect(css).toContain(".hero { padding-top: 5.7rem;");
    expect(css).toContain("align-content: start; padding-top: clamp(7rem,12vh,9rem)");
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.brand-signal__rotor::after \{ animation: brand-signal-horizontal/);
    expect(css).not.toContain("hero-signal");
    expect(html).not.toContain("hero-signal");
  });

  it("uses one accessible animated brand mark in the header, not above the headline", () => {
    const header = html.match(/<header[\s\S]*?<\/header>/)![0];
    expect(header).not.toContain("<span>TooolVibes</span>");
    expect(header).not.toContain('class="brand"');
    expect(header.match(/class="brand-signal"/g)).toHaveLength(1);
    expect(header.match(/tooolvibes-logo\.webp/g)).toHaveLength(1);
    const signal = header.slice(header.indexOf('<div class="brand-signal"'), header.indexOf("<nav"));
    expect(signal).toContain('role="img" aria-label="TooolVibes"');
    expect(signal).toContain('class="brand-signal__field" aria-hidden="true"');
    expect(signal.match(/brand-signal__orbit(?: |")/g)).toHaveLength(2);
    expect(signal).not.toMatch(/<(?:a|button)\b/);
    expect(signal).not.toContain("__trail");
    expect(signal).not.toContain("__direction");
    expect(html).toMatch(/<div class="hero__copy">\s*<h1 id="hero-title">/);
  });

  it("renders the hero immediately while preserving the later section reveals", () => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    expect(doc.querySelector(".hero__copy[data-reveal]")).toBeNull();
    expect(doc.querySelector(".hero__copy h1#hero-title")).not.toBeNull();
    expect(doc.querySelectorAll(".hero__copy .hero__actions a")).toHaveLength(2);
    expect(doc.querySelectorAll(".service [data-reveal]").length).toBeGreaterThan(0);
    dom.window.close();
  });

  it("places the explorer heading before its track before scripts run", () => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const journey = doc.querySelector(".journey")!;
    const title = journey.querySelector(":scope > #journey-title")!;
    const track = journey.querySelector(":scope > .journey__track")!;
    expect(doc.querySelectorAll("#journey-title")).toHaveLength(1);
    expect(title).not.toBeNull();
    expect(title.nextElementSibling).toBe(track);
    expect(track.querySelector("#journey-title")).toBeNull();
    expect(journey.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.querySelector(".journey__arrival")).not.toBeNull();
    dom.window.close();
  });

  it("uses a smaller lossless logo without changing any decoded pixels or the PNG favicon", async () => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const logos = [...doc.querySelectorAll('img[src*="tooolvibes-logo"]')];
    expect(logos).toHaveLength(5);
    for (const logo of logos) expect(logo.getAttribute("src")).toBe("/assets/tooolvibes-logo.webp");
    expect(doc.querySelector('link[rel="icon"]')!.getAttribute("href")).toBe("/assets/tooolvibes-logo.png");
    dom.window.close();
    const png = readFileSync(resolve(root, "assets/tooolvibes-logo.png"));
    const webp = readFileSync(resolve(root, "assets/tooolvibes-logo.webp"));
    expect(webp.byteLength).toBeLessThan(png.byteLength * .65);
    const original = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const optimized = await sharp(webp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(optimized.info).toMatchObject({ width: 192, height: 192, channels: 4 });
    expect(optimized.info).toEqual(original.info);
    expect(optimized.data.equals(original.data)).toBe(true);
  });
  it("has independent canonical and social metadata", () => {
    expect(html).toContain('href="https://servizi.tooolvibes.eu/"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('type="application/ld+json"');
  });

  it("contains no navigation to the main TooolVibes platform", () => {
    expect(html).not.toMatch(/href=["']https:\/\/tooolvibes\.eu/i);
    expect(html).not.toMatch(/href=["']\/(archivio|radar|account|compare|shop)/i);
  });

  it("preserves the compact vertical mobile service composition and shared artwork", () => {
    const service = css.match(/\.service \{([^}]+)\}/)![1];
    expect(service).toContain("grid-template-columns: minmax(0,1fr)");
    expect(service).toContain("justify-items: center");
    expect(service).not.toContain("min-height");
    const copy = css.match(/\.section-copy \{([^}]+)\}/)![1];
    expect(copy).toContain("order: -1");
    expect(copy).toContain("max-width: 34rem");
    for (const [kind, width] of [["chatbot", "27.5rem"], ["social", "28rem"], ["web", "27.75rem"]]) {
      expect(css).toContain(`.service-visual--${kind} { width: min(100%, ${width}); }`);
    }
    expect(css).not.toContain(".service--social { grid-template-columns:");
    expect(css).not.toContain(".service--social .section-copy { order: 2;");
    expect(html.match(/sizes="\(max-width: 48rem\) calc\(100vw - 1rem\), 28rem"/g)).toHaveLength(3);
  });

  it("places each original service image directly after its number and before its heading", () => {
    const sections = [...html.matchAll(/<section[^>]*data-service="(web|social|ai)"[^>]*>([\s\S]*?)<\/section>/g)];
    expect(sections).toHaveLength(3);
    for (const [, service, section] of sections) {
      expect(section).toMatch(/<div class="section-copy" data-reveal>\s*<p class="section-number">[\s\S]*?<\/p>\s*<figure class="service-visual [^"]+">[\s\S]*?<\/figure>\s*<h2/);
      expect(section.match(/<figure class="service-visual /g)).toHaveLength(1);
      expect(section).toContain(`/assets/service-${service === "ai" ? "chatbot" : service}-v2.webp`);
    }
    expect(css).toContain(".section-copy > .service-visual { left: 50%; translate: -50% 0;");
  });

  it("scopes the desktop art direction above 1024px while preserving the mobile foundations", () => {
    const desktop = css.slice(css.indexOf("/* Desktop composition."), css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(desktop).toContain("@media (min-width: 64.01rem)");
    expect(desktop).toContain(".hero__actions { justify-content: center;");
    expect(desktop).toContain("grid-template-columns: minmax(0,1.4fr) minmax(18rem,.9fr)");
    expect(desktop).toContain(".service-offer__value { grid-column: 3;");
    expect(desktop).toContain(".service-offer .service-capacity { grid-column: 2;");
    expect(desktop).toContain(".method-rail { grid-column: 2;");
    expect(desktop).toContain("calc(100svh - 17rem)");
    expect(desktop).not.toContain(".service-visual--web");
    expect(html.match(/class="service-visual /g)).toHaveLength(3);
  });

  it("layers the shared artwork into desktop service backgrounds without covering controls", () => {
    const desktop = css.slice(css.indexOf("/* Desktop composition."), css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    const artwork = desktop.match(/\.service \.service-visual \{([^}]+)\}/)![1];
    expect(artwork).toContain("position: absolute; top: 0; left: 0");
    expect(artwork).toContain("translate: none");
    expect(artwork).toContain("z-index: 0");
    expect(artwork).toContain("pointer-events: none");
    expect(artwork).toContain("mask-image:");
    expect(desktop).toContain(".service .section-copy { grid-area: 1 / 1;");
    expect(desktop).toContain(".service .section-copy > :not(.service-visual) { position: relative; z-index: 1;");
    expect(desktop).toContain("max-width: min(62%,26rem)");
    expect(desktop).not.toContain("background-image: url(");
  });

  it("adapts availability notices to desktop without changing the compact mobile layout", () => {
    const desktop = css.slice(css.indexOf("/* Desktop composition."), css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(desktop).toContain(".availability-notice { width: 32rem;");
    expect(desktop).toContain("grid-template-columns: 2.75rem minmax(0,1fr) max-content 2.75rem");
    expect(desktop).toContain(".availability-notice__content { grid-column: 2 / 4;");
    expect(desktop).toContain(".availability-notice__slots { grid-column: 1 / 3; grid-row: 2;");
    expect(desktop).toContain(".availability-notice .availability-notice__cta { grid-column: 3 / 5; grid-row: 2;");
    expect(desktop).toContain(".availability-notice:has(.availability-notice__slots[hidden]) .availability-notice__cta");
    const mobile = css.slice(0, css.indexOf("/* Desktop composition."));
    expect(mobile).toContain("width: min(23rem, calc(100% - 2rem))");
    expect(mobile).toContain("grid-template-columns: 2.75rem minmax(0, 1fr) 2rem");
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
    expect(app).not.toContain("journey__connection");
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

  it("composes the requested hero statements with responsive wrapping and restrained indices", () => {
    expect(html.match(/class="hero__title-line"/g)).toHaveLength(2);
    expect(html).toContain("I servizi digitali di cui hai bisogno.</span>");
    expect(html).toContain('Un team reale <span class="text-gradient">su cui puoi contare.</span>');
    expect(css).toContain(".hero__title-line { display: block; text-wrap: balance; }");
    expect(html.match(/class="journey__index" aria-hidden="true">[123]<\/span>/g)).toHaveLength(3);
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("@keyframes index-orbit");
    expect(css).toContain("@keyframes control-sheen");
    expect(css).toContain(".button:disabled::before { display: none; }");
  });

  it("uses the requested automated content and conversation headlines with matching descriptions", () => {
    expect(html).toContain('I tuoi contenuti. <span class="text-gradient">Creati e pubblicati in automatico.</span>');
    expect(html).toContain('Ogni conversazione social. <span class="text-gradient">Gestita in automatico.</span>');
    expect(html).toContain("creiamo i contenuti con l’AI e ne automatizziamo la pubblicazione su Facebook e Instagram");
    expect(html).toContain("Le richieste ricorrenti vengono gestite in automatico");
    expect(html).toContain("A seguirti c’è un team di persone");
  });

  it("animates benefit icons without bullets or perpetual motion", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("detail-arrive .6s");
    expect(css).toContain("detail-arrive .6s var(--ease) var(--detail-delay) both");
    expect(css).toContain(".service-benefits.is-in-view li");
    expect(css).not.toContain(".service.is-in-view .service-benefits svg");
    expect(css).not.toContain(".plain-list");
    expect(css).not.toContain(".flow-legend");
  });

  it("uses the exact requested benefit lists with decorative native icons", () => {
    const expected = [
      ["Un nuovo volto al tuo sito", "Chiaro su ogni schermo", "Prenotazioni dal sito", "Più facile da trovare online", "WhatsApp a portata di clic", "Contattarti è più semplice", "Assistenza anche dopo il lancio"],
      ["Un’identità che ti distingue", "Contenuti creati con AI", "Pubblicazioni regolari", "Più tempo per la tua attività"],
      ["Risposte senza attese", "Assistenza a ogni ora", "Nuovi contatti da seguire", "Prenotazioni in autonomia", "Messaggi per ricontattare"],
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
    expect(html).toContain("Funzioni, integrazioni e costi di utilizzo vengono definiti nel tuo preventivo.");
    expect(html).toContain("3 mesi al prezzo di 1");
    expect(css).toContain("scene-frame");
    expect(html).not.toContain("IVA");
  });

  it("makes comparison prices prominent and gives every promotion the same explicit deadline", () => {
    expect(html.match(/class="service-offer__deadline"/g)).toHaveLength(3);
    expect(html.match(/Promo fino al <time datetime="2026-11-30">30 novembre<\/time>/g)).toHaveLength(3);
    const comparison = css.match(/\.service-offer__comparison s \{([^}]+)\}/)![1];
    expect(css).toContain("--price-comparison: #ff8e99");
    expect(comparison).toContain("color: var(--price-comparison)");
    expect(comparison).toContain("font-size: 1.18em");
    expect(comparison).toContain("font-weight: 750");
    expect(comparison).toContain("text-decoration-thickness: 2px");
    expect(css).toContain(".service-offer__deadline time { font-weight: 650; }");
  });

  it("highlights compact final prices and explicit comparison amounts", () => {
    expect(css).toContain("--price-accent: #7cebb4");
    expect(css).toContain("--price-comparison: #ff8e99");
    expect(css).toContain("price-border-flow 4.8s");
    expect(html).not.toContain("Riferimento indicativo");
    expect(html.match(/<s>/g)).toHaveLength(3);
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain("white-space: nowrap");
    expect(html.match(/class="service-offer__amount"/g)).toHaveLength(3);
  });

  it("highlights service names in responsive accent pills, separate from promotions", () => {
    expect([...html.matchAll(/class="service-offer__label">([^<]+)<\/p>/g)].map((match) => match[1])).toEqual([
      "Sito web", "Automazione contenuti", "Attivazione chatbot AI",
    ]);
    const labelStyles = css.match(/\.service-offer__label \{([^}]+)\}/)?.[1];
    expect(labelStyles).toContain("width: fit-content");
    expect(labelStyles).toContain("max-width: 100%");
    expect(labelStyles).toContain("border-radius: 999px");
    expect(labelStyles).toContain("var(--service-accent)");
    expect(labelStyles).toContain("box-shadow:");
    expect(html).toContain('<p class="service-offer__promotion">3 mesi al prezzo di 1</p>');
    expect([...html.matchAll(/class="section-number__label">([^<]+)<\/span>/g)].map((match) => match[1])).toEqual([
      "Sito web", "Automazione contenuti", "Attivazione chatbot AI",
    ]);
    expect(css).toMatch(/\.section-number__label \{ position: absolute;[^}]*bottom: calc\(100% \+ .55rem\)/);
  });

  it("removes the explorer connection copy and its responsive presentation", () => {
    expect(html).not.toContain("Un servizio per iniziare");
    expect(html).not.toContain("journey__connection");
    expect(css).not.toContain("journey__connection");
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
    expect(html).toContain("questo mese resta 1 posto su 5");
    expect(html).toContain("questo mese restano 3 posti su 5");
    expect(html).toContain("Disponibilità su richiesta");
    expect(html.match(/class="service-capacity__note">Scrivici per concordare la partenza\./g)).toHaveLength(3);
    expect(html).not.toContain("tra tutti i servizi");
    expect(html.match(/class="service-capacity__number" aria-hidden="true"/g)).toHaveLength(3);
    expect(html).toContain("<span>05</span><span>04</span><span>03</span><span>02</span><span>01</span>");
    expect(html).toContain("<span>05</span><span>04</span><span>03</span>");
    expect(html).not.toContain("<span>00</span>");
    expect(html.match(/class="is-assigned"/g)).toHaveLength(12);
    expect(html.match(/<a class="service-capacity" href="#contatti"/g)).toHaveLength(3);
    expect(css).not.toContain('@keyframes capacity-signal');
    expect(html).not.toMatch(/posti rimasti|scade tra|data-countdown/i);
    expect(css).toContain("container-type: inline-size");
    expect(css).toContain("grid-template-columns: minmax(0,1fr) auto");
  });

  it("shares one CTA interaction and animates the border and confirmed capacity without moving prices", () => {
    expect(css).toContain('.button:is(:focus-visible,:active):not(:disabled)::before { animation: control-sheen .75s');
    expect(css).not.toContain('animation: control-response');
    expect(css).not.toContain('.button--secondary:is(:hover,:focus-visible) svg');
    expect(css).toContain('.service-offer.is-in-view::after { animation: price-border-flow 4.8s ease-in-out infinite alternate');
    expect(css).toContain('mask-composite: exclude');
    expect(css).toContain('opacity: .85');
    expect(css).toContain('@keyframes capacity-count');
    expect(css).toContain('@keyframes capacity-tone');
    expect(css).toContain('steps(var(--count-steps),end)');
    expect(css).toContain('.service-capacity.has-counted .service-capacity__digits');
    expect(css).toContain('capacity-breathe 6.4s ease-in-out infinite');
    expect(css).toContain('notice-bloom 1.6s ease-out both');
    for (const animation of ['price-arrive', 'price-light', 'price-line', 'capacity-slot', 'capacity-arrive', 'capacity-orbit', 'capacity-response']) expect(css).not.toContain(`@keyframes ${animation}`);
    expect(css).not.toContain('.service-offer__price::before');
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain('querySelectorAll(".service-offer").forEach((element) => sceneObserver.observe(element))');
  });

  it("synchronizes countdown colours from green through yellow and orange to red on every viewport", () => {
    const mobile = css.slice(css.indexOf("/* Availability countdown:"), css.indexOf("/* Desktop composition."));
    expect(mobile).not.toContain("max-width");
    expect(mobile).toContain("@media (prefers-reduced-motion: no-preference)");
    for (const [available, colour] of [[5, "#7cebb4"], [4, "#c6e884"], [3, "#f5cf73"], [2, "#ffad70"], [1, "#ff8a86"]]) {
      expect(mobile).toContain(`:is(.service-capacity,.availability-notice,.availability-launcher)[data-available="${available}"] { --capacity-accent: ${colour};`);
    }
    expect(mobile).toContain("calc(var(--count-duration) * 4 / var(--count-steps)) linear .35s calc(var(--count-steps) / 4) both");
    expect(mobile).toContain(".service-capacity__number,\n  .service-capacity__slots { color: inherit; }");
    expect(mobile).toContain(':not([data-available="request"]):not([data-available="5"])');
    expect(mobile).toContain("25%,45% { color: #c6e884; }");
    expect(mobile).toContain("50%,70% { color: #f5cf73; }");
    expect(mobile).toContain("75%,95% { color: #ffad70; }");
    expect(mobile).toContain("100% { color: #ff8a86; }");
    expect(mobile).toContain(".service-capacity__slots i,\n  .service-capacity__slots i.is-assigned { border-color: color-mix(in srgb,currentColor");
    expect(mobile).toContain(".service-capacity__orbit circle.is-assigned { stroke: currentColor; }");
  });

  it("shares confirmed scarcity colours with notices and pulses their glow without layout motion", () => {
    const notice = css.slice(css.indexOf(".availability-notice {"), css.indexOf(".error-page {"));
    expect(notice).toContain(':is(.availability-notice,.availability-launcher)[data-available]:not([data-available="request"]) { --notice-accent: var(--capacity-accent); }');
    expect(notice).toContain('.availability-notice[data-available]:not([data-available="request"]) .availability-notice__title { color: var(--notice-accent);');
    expect(notice).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(notice).toContain('notice-bloom 1.6s ease-out both,notice-breathe 5.6s ease-in-out 1.6s infinite');
    expect(notice).toContain('@keyframes notice-breathe { 0%,100% { opacity: .55; } 50% { opacity: .95; } }');
  });

  it("fades mobile bars and arcs without freezing intermediate countdown colours", () => {
    const mobile = css.slice(css.indexOf("/* Availability countdown:"), css.indexOf("/* Desktop composition."));
    expect(mobile.match(/animation-name: capacity-mobile-assigned;/g)).toHaveLength(2);
    expect(mobile).toContain("@keyframes capacity-mobile-assigned { from { opacity: 1; } to { opacity: .16; } }");
    expect(mobile).not.toContain("capacity-mobile-ring-status");
    expect(mobile).not.toContain("i:not(.is-assigned)");
  });

  it("uses a single inherited colour clock without replacing countdown or breathing motion", () => {
    const mobile = css.slice(css.indexOf("/* Availability countdown:"), css.indexOf("/* Desktop composition."));
    expect(mobile).toContain("animation: var(--capacity-spectrum);");
    expect(mobile).toContain("animation: var(--capacity-spectrum),capacity-breathe 6.4s ease-in-out infinite;");
    expect(mobile).toContain(".service-capacity.has-counted .service-capacity__number { animation: none; }");
    expect(mobile).toContain(".service-capacity__copy { color: var(--ink); }");
    expect(mobile.match(/--capacity-spectrum: capacity-mobile-spectrum/g)).toHaveLength(1);
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
    expect(html).toContain("Invia il messaggio");
    const app = readFileSync(resolve(root, "app.js"), "utf8");
    expect(app).toContain("if (submitPending) return");
    expect(app).toContain('input.setAttribute("aria-invalid", "true")');
  });

  it("keeps longer Italian method descriptions aligned beside their number on mobile", () => {
    expect(css).toContain("grid-template-columns: 2.9rem minmax(0,1fr)");
    expect(css).toContain(".method-ready .process-step p { grid-column: 2; grid-row: 2; max-width: none; }");
    expect(css).not.toContain("float: left");
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
    expect(app).toContain('querySelectorAll(".service[data-service], .service-visual")');
    expect(app).toContain("journeyObserver.observe(track)");
  });
});
