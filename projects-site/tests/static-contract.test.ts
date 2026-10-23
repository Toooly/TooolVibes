import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "projects-site");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");

describe("Isolated TooolVibes projects landing", () => {
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

  it("shares a distinct champagne, rose and platinum palette across the entire project experience", () => {
    const base = css.match(/:root \{([^}]+)\}/)![1];
    for (const [service, color] of [["ecommerce", "#e8c582"], ["app", "#e7a0b3"], ["software", "#d3dce4"]]) {
      expect(base).toContain(`--service-${service}: ${color}`);
      expect(css).toContain(`[data-journey-select="${service}"] { --choice-accent: var(--service-${service}); }`);
    }
    expect(css).not.toContain(".journey, .contact-panel { --service-ecommerce:");
  });

  it("illuminates each contact option and its selection indicator with its own service accent", () => {
    for (const service of ["ecommerce", "app", "software"]) {
      expect(css).toContain(`.need-options input[value="${service}"] + span { --need-accent: var(--service-${service}); }`);
    }
    for (const selector of [".need-options input:checked + span", ".need-options input:checked + span::after", ".need-options label:hover input:not(:checked) + span"]) {
      const rule = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
      expect(rule).toContain("border-color: var(--need-accent,var(--cyan))");
      expect(rule).toContain("background:");
      expect(rule).not.toContain("background: var(--cyan)");
    }
    expect(css).toContain(".need-options input:focus-visible + span { outline: 3px solid var(--amber)");
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
    expect(header.match(/tooolvibes-logo\.png/g)).toHaveLength(1);
    const signal = header.slice(header.indexOf('<div class="brand-signal"'), header.indexOf("<nav"));
    expect(signal).toContain('role="img" aria-label="TooolVibes"');
    expect(signal).toContain('class="brand-signal__field" aria-hidden="true"');
    expect(signal.match(/brand-signal__orbit(?: |")/g)).toHaveLength(2);
    expect(signal).not.toMatch(/<(?:a|button)\b/);
    expect(signal).not.toContain("__trail");
    expect(signal).not.toContain("__direction");
    expect(html).toMatch(/<div class="hero__copy" data-reveal>\s*<h1 id="hero-title">/);
  });
  it("owns its canonical, metadata, sitemap, privacy and email origin", () => {
    for (const file of ["public/index.html", "public/robots.txt", "public/sitemap.xml", "public/privacy/index.html", "src/worker.ts", "src/thank-you-email.ts"]) {
      expect(read(file)).toContain("progetti.tooolvibes.eu");
      expect(read(file)).not.toContain("servizi.tooolvibes.eu");
    }
    expect(html).toContain("og-projects.webp");
    expect(html).toContain('"serviceType": ["E-commerce", "Creazione app", "Software personalizzato"]');
  });

  it("keeps native, ordered services and independently addressable scenes", () => {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    expect([...doc.querySelectorAll(".service[data-service]")].map(el => el.getAttribute("data-service"))).toEqual(["ecommerce", "app", "software"]);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    for (const key of ["ecommerce", "app", "software"]) {
      expect(doc.querySelector(`[data-journey-select="${key}"]`)).not.toBeNull();
      expect(doc.querySelector(`[data-journey-scene="${key}"]`)).not.toBeNull();
      expect(doc.querySelector(`[name="need"][value="${key}"]`)).not.toBeNull();
      const image = doc.querySelector(`[data-service="${key}"] .service-visual img`)!;
      expect(image.getAttribute("src")).toBe(`/assets/project-${key}.webp`);
      expect(image.getAttribute("srcset")).toContain(`/assets/project-${key}-640.webp 640w`);
      expect(image.getAttribute("alt")!.length).toBeGreaterThan(30);
    }
    const ids = [...doc.querySelectorAll("[id]")].map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    dom.window.close();
  });

  it("has the lower bounded launch offers without invented former prices or scarcity", () => {
    const dom = new JSDOM(html);
    expect([...dom.window.document.querySelectorAll(".service-offer__amount")].map(el => el.textContent)).toEqual(["2.490", "8.900", "11.900"]);
    expect(dom.window.document.querySelectorAll(".service-offer__promotion")).toHaveLength(3);
    expect(dom.window.document.querySelectorAll('.service-capacity[data-available="request"]')).toHaveLength(3);
    expect(dom.window.document.querySelectorAll(".service-capacity__digits,.service-capacity__slots,s,time")).toHaveLength(0);
    expect(html).not.toContain("Anziché");
    expect(dom.window.document.querySelectorAll(".service-offer__note")).toHaveLength(3);
    expect(dom.window.document.querySelectorAll(".project-price__caption")).toHaveLength(3);
    dom.window.close();
  });

  it("identifies independently published references rather than claiming our prior list price", () => {
    expect(html).toContain("Progetti Shopify da 3.500 €");
    expect(html).toContain("MVP mobile: 15.000–40.000 €");
    expect(html).toContain("MVP software: 5.000–15.000 €");
    expect(html).toContain("Un riferimento esterno, non un nostro prezzo precedente.");
    for (const domain of ["dsidesign.it", "federicotassara.com", "antha.it"]) expect(html).toContain(domain);
  });

  it("has only real local assets and local navigation, except explicitly marked research sources", () => {
    const dom = new JSDOM(html);
    for (const el of dom.window.document.querySelectorAll("img[src],script[src],link[rel=stylesheet]")) {
      const asset = el.getAttribute("src") || el.getAttribute("href")!;
      expect(existsSync(resolve(root, "public", asset.slice(1))), asset).toBe(true);
    }
    for (const link of dom.window.document.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href")!;
      expect(href.startsWith("#") || href === "/privacy/" || Boolean(link.closest(".project-price__reference")), href).toBe(true);
      if (href.startsWith("#")) expect(dom.window.document.getElementById(href.slice(1)), href).not.toBeNull();
    }
    expect(html).not.toMatch(/href=["']https:\/\/(?:servizi\.)?tooolvibes\.eu/i);
    dom.window.close();
  });

  it("preserves the scroll-paced method and explorer with reduced-motion support", () => {
    expect(html).toContain("data-method-track");
    expect(html).toContain("data-journey");
    expect(app).toContain('const order = ["ecommerce", "app", "software"]');
    expect(app).toContain('action: "projects_contact"');
    expect(app).not.toContain('action: "services_contact"');
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("--journey-sticky-top");
    expect(css).toContain("@keyframes project-flow");
    expect(html).not.toContain("software tuoi");
    expect(app).not.toContain("Vai software contatti");
    expect(read("public/privacy/index.html")).toContain("accedere ai tuoi dati");
  });

  it("requires isolated production bindings and blocks test-widget deployments", () => {
    const config = JSON.parse(read("wrangler.jsonc"));
    expect(config.name).toBe("tooolvibes-progetti");
    expect(config.routes).toEqual([{ pattern: "progetti.tooolvibes.eu", custom_domain: true }]);
    expect(config.services).toBeUndefined();
    expect(config.workers_dev).toBe(false);
    expect(config.preview_urls).toBe(false);
    expect(config.secrets.required).toEqual(["RESEND_API_KEY", "PROJECTS_NOTIFY_EMAIL", "PROJECTS_TURNSTILE_SECRET_KEY"]);
    expect(config.ratelimits.map((r: { namespace_id: string }) => r.namespace_id)).toEqual(["2026102201", "2026102202"]);
    expect(read("scripts/deploy.mjs")).toContain("Test keys are not permitted");
    expect(read("scripts/deploy.mjs")).toContain('"--keep-vars"');
    expect(read("scripts/deploy.mjs")).toContain('"refs/heads/main"');
  });
});
