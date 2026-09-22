import { chromium } from "@playwright/test";
import fs from "node:fs";

const [base, w, h, route, name, action = "none", ctaSel = ""] = process.argv.slice(2);
const OUT = "artifacts/final-release-candidate";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
  colorScheme: "dark",
  locale: "it-IT",
});
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

await page.goto(base + route, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("button", { name: /Rifiuta/i }).click({ timeout: 2500 }).catch(() => {});

await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 20000 }).catch(() => {});
await page.waitForFunction(
  () => Boolean(document.documentElement.dataset.tvBottomNav) || Boolean(document.querySelector("header")),
  null,
  { timeout: 20000 },
).catch(() => {});
await page.evaluate(() => { window.scrollTo(0, 0); });
await page.waitForTimeout(250);
await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(150);

if (action === "sheet") {
  const btn = page.getByRole("button", { name: /Valuta|Decidi|Rivedi/i }).first();
  await btn.click({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(700);
}
if (action === "footer") {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, document.documentElement.scrollHeight); });
  await page.waitForTimeout(500);
}

const gate = await page.evaluate((ctaSel) => {
  const parse = (c) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || "");
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  };
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const body = getComputedStyle(document.body);
  const html = getComputedStyle(document.documentElement);
  const h1 = document.querySelector("h1");
  const h1cs = h1 ? getComputedStyle(h1) : null;
  const bg = parse(body.backgroundColor) ?? parse(html.backgroundColor) ?? [255, 255, 255];
  const defaultBlue = [...document.querySelectorAll("a, button")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 4 && r.height > 4 && cs.visibility !== "hidden" && cs.display !== "none";
    })
    .map((el) => getComputedStyle(el).color)
    .filter((c) => /rgba?\(0,\s*0,\s*(238|255)/.test(c));
  const sheets = document.styleSheets.length;
  const cta = ctaSel ? document.querySelector(ctaSel) : null;
  const ctaCs = cta ? getComputedStyle(cta) : null;
  return {
    bg: body.backgroundColor,
    bgLum: Math.round(lum(bg)),
    htmlBg: html.backgroundColor,
    bodyFont: body.fontFamily,
    h1Font: h1cs ? h1cs.fontFamily : null,
    h1Size: h1cs ? h1cs.fontSize : null,
    linkCount: document.querySelectorAll("a").length,
    defaultBlue,
    sheets,
    ctaSel,
    ctaPresent: Boolean(cta),
    ctaBg: ctaCs ? ctaCs.backgroundColor : null,
    ctaColor: ctaCs ? ctaCs.color : null,
    ctaRadius: ctaCs ? ctaCs.borderRadius : null,
    navPresent: Boolean(document.querySelector(".mobile-bottom-shell")),
    h1: h1 ? h1.textContent.trim().slice(0, 60) : null,
  };
}, ctaSel);

const fail = [];
if (gate.bgLum > 70) fail.push(`light background lum=${gate.bgLum} bg=${gate.bg}`);
if (gate.defaultBlue.length > 0) fail.push(`default-blue links x${gate.defaultBlue.length}`);
if (gate.sheets < 3) fail.push(`few stylesheets sheets=${gate.sheets}`);
if (gate.linkCount < 3) fail.push(`too few links linkCount=${gate.linkCount}`);
if (ctaSel && !gate.ctaPresent) fail.push(`missing CTA ${ctaSel}`);
if (gate.ctaBg && !/^rgba?\((2[0-9]{2}|1[5-9][0-9]),\s*(1[4-9][0-9]|2[0-9]{2}),\s*([0-9]|[1-9][0-9]|1[01][0-9])/.test(gate.ctaBg)) fail.push(`CTA not gold: ${gate.ctaBg}`);

const file = `${OUT}/${name}-final-render.png`;
if (fail.length === 0) {
  if (action === "footer") {
    const footer = page.locator("footer").first();
    await footer.screenshot({ path: file }).catch(async () => {
      await page.screenshot({ path: file });
    });
  } else {
    await page.screenshot({ path: file });
  }
}

fs.appendFileSync(`${OUT}/STYLE-GATES-RC.jsonl`, JSON.stringify({
  name, base, route, viewport: `${w}x${h}`, action, ...gate, fail, file: fail.length ? null : file,
}) + "\n");
console.log(fail.length ? "FAIL" : "ok", name, fail.join("; ") || `bg=${gate.bg} font=${gate.h1Font || gate.bodyFont}`);
await browser.close();
