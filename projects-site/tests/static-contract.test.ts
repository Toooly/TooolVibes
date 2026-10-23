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
  it("uses a distinct champagne, rose and platinum palette scoped to the project explorer", () => {
    const explorer = css.match(/\.journey \{([^}]+)\}/)![1];
    for (const [service, color] of [["ecommerce", "#e8c582"], ["app", "#e7a0b3"], ["software", "#d3dce4"]]) {
      expect(explorer).toContain(`--service-${service}: ${color}`);
      expect(css).toContain(`[data-journey-select="${service}"] { --choice-accent: var(--service-${service}); }`);
    }
    const base = css.match(/:root \{([^}]+)\}/)![1];
    expect(base).toContain("--service-ecommerce: #6fa9ff");
    expect(base).toContain("--service-app: #c195ff");
    expect(base).toContain("--service-software: #70e4af");
  });


  it("keeps a symbol-only accessible header and a decorative CSS logo cue above the hero title", () => {
    const header = html.match(/<header[\s\S]*?<\/header>/)![0];
    expect(header).not.toContain("<span>TooolVibes</span>");
    expect(header).toContain('alt="TooolVibes"');
    expect(header.match(/<div class="brand">[\s\S]*?<\/div>/)![0]).not.toContain("<a");
    const signal = html.slice(html.indexOf('<div class="hero-signal"'), html.indexOf('<h1 id="hero-title"'));
    expect(signal).toContain('aria-hidden="true"');
    expect(signal).toContain('src="/assets/tooolvibes-logo.png"');
    expect(signal.match(/hero-signal__orbit(?: |")/g)).toHaveLength(2);
    expect(signal).not.toMatch(/<(?:a|button|p|h[1-6])\b/);
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("hero-signal-flow 3.6s");
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
