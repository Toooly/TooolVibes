import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL =
  process.env.RESPONSIVE_QA_BASE_URL ?? "http://127.0.0.1:3000";
const OUTPUT_DIR =
  process.env.RESPONSIVE_QA_OUTPUT_DIR ??
  path.join("/tmp", "tooolvibes-responsive-typography");
const LABEL = process.env.RESPONSIVE_QA_LABEL ?? "candidate";
const CAPTURE_FULL_PAGE = process.env.RESPONSIVE_QA_FULL_PAGE === "1";

const ROUTES = [
  {
    id: "home",
    path: "/",
    readyText: "Scegli il tool giusto",
  },
  { id: "archive", path: "/archivio", readyText: "Riduci le alternative" },
  { id: "radar", path: "/radar", readyText: "Segui i lanci" },
  {
    id: "compare",
    path: "/compare",
    readyText: "Metti a confronto",
  },
  {
    id: "shortlist",
    path: "/shortlist",
    readyText: "La tua shortlist è pronta a riempirsi.",
  },
  {
    id: "collections",
    path: "/collections",
    readyText: "Scegli il percorso",
  },
  {
    id: "collection-detail",
    path: "/collections/ai-stack-solo-founders",
    readyText: "Stack AI per founder solo",
  },
  {
    id: "posts",
    path: "/posts",
    readyText: "Guide scritte per",
  },
  {
    id: "post-detail",
    path: "/posts/reclaim-ai",
    readyText: "Reclaim AI",
  },
  {
    id: "contributi",
    path: "/contributi",
    readyText: "Le scelte migliori meritano contesto.",
  },
  {
    id: "chi-siamo",
    path: "/chi-siamo",
    readyText: "Persone vere, prodotti digitali vivi.",
    h1MaxLines: { desktop: 4 },
  },
  {
    id: "studio",
    path: "/studio",
    readyText: "Diamo forma a decisioni più chiare.",
  },
  {
    id: "affiliati",
    path: "/affiliati",
    readyText: "Porta TooolVibes alla tua community.",
  },
  {
    id: "account",
    path: "/account",
    readyText: "Entra nel tuo spazio",
  },
  {
    id: "shop",
    path: "/shop",
    readyText: "Lo Shop TooolVibes è in preparazione.",
  },
  { id: "privacy", path: "/privacy", readyText: "Privacy" },
  { id: "termini", path: "/termini", readyText: "Termini" },
  { id: "cookie", path: "/cookie", readyText: "Cookie" },
  {
    id: "tags",
    path: "/tags",
    readyText: "Esplora TooolVibes per categoria, livello e caso d'uso.",
  },
  {
    id: "tool-detail",
    path: "/toools/blink",
    readyText: "Blink",
    heroSelector: ".td-final-hero",
  },
];
const REQUESTED_ROUTE_IDS = new Set(
  (process.env.RESPONSIVE_QA_ROUTE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const ACTIVE_ROUTES =
  REQUESTED_ROUTE_IDS.size > 0
    ? ROUTES.filter((route) => REQUESTED_ROUTE_IDS.has(route.id))
    : ROUTES;

const RELEASE_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 1000 },
  { width: 1728, height: 1117 },
  { width: 1920, height: 1080 },
];

const CONTINUITY_VIEWPORTS = [
  { width: 767, height: 900 },
  { width: 768, height: 900 },
  { width: 1023, height: 800 },
  { width: 1024, height: 800 },
  { width: 1279, height: 800 },
  { width: 1280, height: 800 },
];

const VIEWPORTS =
  process.env.RESPONSIVE_QA_CONTINUITY === "1"
    ? CONTINUITY_VIEWPORTS
    : RELEASE_VIEWPORTS;

const browser = await chromium.launch({ headless: true });
const results = [];

await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(path.join(OUTPUT_DIR, "viewport"), { recursive: true });
if (CAPTURE_FULL_PAGE) {
  await mkdir(path.join(OUTPUT_DIR, "full-page"), { recursive: true });
}

function fileStem(route, viewport) {
  return `${route.id}-${viewport.width}x${viewport.height}`;
}

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    colorScheme: "dark",
    locale: "it-IT",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    viewport,
  });

  for (const route of ACTIVE_ROUTES) {
    const page = await context.newPage();
    const consoleMessages = [];
    const pageErrors = [];
    const failedResources = [];
    const httpErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleMessages.push({
          type: message.type(),
          text: message.text().slice(0, 500),
        });
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        httpErrors.push({
          status: response.status(),
          url: response.url().slice(0, 300),
        });
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message.slice(0, 500));
    });
    page.on("requestfailed", (request) => {
      failedResources.push({
        error: request.failure()?.errorText ?? "unknown",
        type: request.resourceType(),
        url: request.url(),
      });
    });

    const stem = fileStem(route, viewport);
    try {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        timeout: 45_000,
        waitUntil: "domcontentloaded",
      });
      if (!response || response.status() >= 400) {
        throw new Error(`Unexpected document status: ${response?.status() ?? "no response"}`);
      }
      if (new URL(page.url()).pathname !== route.path) {
        throw new Error(`Unexpected final route: ${new URL(page.url()).pathname}`);
      }
      await page.locator("main").first().waitFor({
        state: "visible",
        timeout: 20_000,
      });
      await page
        .locator("h1")
        .filter({ hasText: route.readyText })
        .first()
        .waitFor({ state: "visible", timeout: 20_000 });
      if (route.readySelector) {
        await page
          .locator(route.readySelector)
          .first()
          .waitFor({ state: "visible", timeout: 20_000 });
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve(undefined)),
          );
        });
      });
      await page.addStyleTag({
        content:
          "*,*::before,*::after{animation-delay:0ms!important;animation-duration:0.001ms!important;transition-delay:0ms!important;transition-duration:0.001ms!important}",
      });
      await page.waitForTimeout(350);

      const measurement = await page.evaluate((heroSelector) => {
        const round = (value, precision = 2) => {
          const factor = 10 ** precision;
          return Math.round(value * factor) / factor;
        };
        const visible = (element) => {
          if (!(element instanceof HTMLElement)) return false;
          if (
            element.closest(
              "[hidden],[inert],[aria-hidden='true'],script,style,template",
            )
          ) {
            return false;
          }
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity) !== 0 &&
            rect.width > 0 &&
            rect.height > 0
          );
        };
        const directText = (element) =>
          Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        const isCompactMetadata = (element) => {
          const className =
            typeof element.className === "string"
              ? element.className.toLowerCase()
              : "";
          return Boolean(
            element.closest(
              ".premium-badge,.pill,.editorial-label,[data-typography='metadata']",
            ) ||
              /(?:eyebrow|kicker|hint|dek|promise|supporting|signal|label|__meta|category|text-meta|metadata|badge|tag|count|date|timestamp)/.test(
                className,
              ),
          );
        };
        const elementLabel = (element) => {
          const id = element.id ? `#${element.id}` : "";
          const classes =
            typeof element.className === "string"
              ? element.className
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((className) => `.${className}`)
                  .join("")
              : "";
          return `${element.tagName.toLowerCase()}${id}${classes}`;
        };
        const classify = (element) => {
          const className =
            typeof element.className === "string"
              ? element.className.toLowerCase()
              : "";
          if (element.tagName === "H1") return "h1";
          if (element.tagName === "H2") return "h2";
          if (/[^\w]lede|__lede|subtitle|__deck/.test(className)) return "lede";
          if (/cta|actions?|buttons?/.test(className)) return "cta-group";
          if (/meta|stats?|rail|eyebrow|kicker/.test(className)) {
            return "metadata";
          }
          if (/title|heading|name/.test(className)) return "card-title";
          return "display-title";
        };
        const readLines = (element) => {
          const words = [];
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
          );
          let node;
          while ((node = walker.nextNode())) {
            const text = node.textContent ?? "";
            const matcher = /\S+/g;
            let match;
            while ((match = matcher.exec(text))) {
              const range = document.createRange();
              range.setStart(node, match.index);
              range.setEnd(node, match.index + match[0].length);
              const rect = range.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                words.push({
                  text: match[0],
                  top: round(rect.top, 1),
                });
              }
            }
          }
          const lines = [];
          for (const word of words) {
            const current = lines.find(
              (line) => Math.abs(line.top - word.top) <= 2,
            );
            if (current) {
              current.words.push(word.text);
            } else {
              lines.push({ top: word.top, words: [word.text] });
            }
          }
          lines.sort((left, right) => left.top - right.top);
          return lines.map((line) => line.words.join(" "));
        };
        const closestContainerWidth = (element) => {
          const container = element.closest(
            "section,article,header,[class*='hero'],[class*='panel'],main",
          );
          return container
            ? round(container.getBoundingClientRect().width)
            : null;
        };
        const candidateSelector = [
          "h1",
          "h2",
          "h3",
          "[class*='title']",
          "[class*='heading']",
          "[class*='lede']",
          "[class*='subtitle']",
          "[class*='deck']",
          "[class*='cta']",
          "[class*='action']",
          "[class*='meta']",
          "[class*='rail']",
          "[class*='eyebrow']",
          "[class*='kicker']",
        ].join(",");
        const elements = Array.from(
          document.querySelectorAll(candidateSelector),
        ).filter(visible);
        const seen = new Set();
        const typography = [];

        for (const element of elements) {
          const text = (element.textContent ?? "")
            .replace(/\s+/g, " ")
            .trim();
          if (!text || text.length > 500) continue;
          const key = `${element.tagName}|${text}|${elementLabel(element)}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const lines = readLines(element);
          const lastLine = lines.at(-1) ?? "";
          const lastLineWords = lastLine.split(/\s+/).filter(Boolean);
          typography.push({
            kind: classify(element),
            element: elementLabel(element),
            text: text.slice(0, 240),
            directText: directText(element).slice(0, 120),
            lineCount: lines.length,
            lines,
            fontFamily: style.fontFamily,
            fontSize: round(Number.parseFloat(style.fontSize)),
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            contentWidth: round(rect.width),
            containerWidth: closestContainerWidth(element),
            height: round(rect.height),
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
            hardBreak: Boolean(element.querySelector("br")),
            orphanFinalLine:
              lines.length > 1 &&
              lastLineWords.length === 1 &&
              (lines.at(-2)?.split(/\s+/).filter(Boolean).length ?? 0) >= 3,
            clipped:
              element.scrollWidth > element.clientWidth + 2 ||
              element.scrollHeight > element.clientHeight + 2,
            dominance: round(rect.height / window.innerHeight),
          });
        }

        const h1 = document.querySelector("h1");
        const selectedHero = heroSelector
          ? Array.from(document.querySelectorAll(heroSelector)).find(visible)
          : null;
        const hero =
          selectedHero ??
          h1?.closest("[class*='hero']") ??
          h1?.closest("section,header,article") ??
          null;
        const h1Lines = h1 && visible(h1) ? readLines(h1) : [];
        const h1Rect =
          h1 && visible(h1) ? h1.getBoundingClientRect() : null;
        const heroRect =
          hero && visible(hero) ? hero.getBoundingClientRect() : null;
        const action = Array.from(
          document.querySelectorAll(
            "main a[href],main button:not([disabled]),main input:not([type='hidden']),main select,main textarea",
          ),
        ).find(visible);
        const actionRect = action?.getBoundingClientRect() ?? null;
        const sections = Array.from(
          document.querySelectorAll("main > section"),
        ).filter(visible);
        const sectionGaps = sections.slice(1).map((section, index) => {
          const previousRect = sections[index].getBoundingClientRect();
          const rect = section.getBoundingClientRect();
          return round(rect.top - previousRect.bottom);
        });
        const meaningfulTextViolations = Array.from(
          document.querySelectorAll(
            "main p,main li,main dt,main dd,main label,main button,main a,main span,main strong",
          ),
        )
          .filter(visible)
          .filter((element) => !isCompactMetadata(element))
          .map((element) => {
            const text = (element.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim();
            const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
            return {
              element: elementLabel(element),
              fontSize: round(fontSize),
              text: text.slice(0, 100),
            };
          })
          .filter(
            (entry) =>
              entry.text.length >= 3 &&
              Number.isFinite(entry.fontSize) &&
              entry.fontSize < 12,
          )
          .slice(0, 50);
        const bodyTextViolations = Array.from(
          document.querySelectorAll("main p,main li"),
        )
          .filter(visible)
          .filter((element) => !isCompactMetadata(element))
          .map((element) => {
            const text = (element.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim();
            const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
            return {
              element: elementLabel(element),
              fontSize: round(fontSize),
              text: text.slice(0, 100),
            };
          })
          .filter(
            (entry) =>
              entry.text.length >= 20 &&
              Number.isFinite(entry.fontSize) &&
              entry.fontSize < 14,
          )
          .slice(0, 50);
        const fontFamilies = [];
        document.fonts.forEach((fontFace) => {
          if (fontFace.status === "loaded") fontFamilies.push(fontFace.family);
        });

        return {
          title: document.title,
          h1: h1Rect
            ? {
                text: (h1.textContent ?? "").replace(/\s+/g, " ").trim(),
                lineCount: h1Lines.length,
                lines: h1Lines,
                height: round(h1Rect.height),
                width: round(h1Rect.width),
                hardBreak: Boolean(h1.querySelector("br")),
                orphanFinalLine:
                  h1Lines.length > 1 &&
                  (h1Lines.at(-1)?.split(/\s+/).filter(Boolean).length ?? 0) ===
                    1 &&
                  (h1Lines.at(-2)?.split(/\s+/).filter(Boolean).length ?? 0) >=
                    3,
              }
            : null,
          hero: heroRect
            ? {
                element: elementLabel(hero),
                height: round(heroRect.height),
                viewportRatio: round(heroRect.height / window.innerHeight, 3),
              }
            : null,
          firstActionY: actionRect ? round(actionRect.top) : null,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          horizontalOverflow:
            document.documentElement.scrollWidth >
              document.documentElement.clientWidth + 1 ||
            document.body.scrollWidth >
              document.documentElement.clientWidth + 1,
          mainSectionGaps: sectionGaps,
          fontStatus: document.fonts.status,
          fontFamilies: Array.from(new Set(fontFamilies)).sort(),
          meaningfulTextViolations,
          bodyTextViolations,
          typography,
        };
      }, route.heroSelector ?? null);

      const viewportScreenshot = path.join(
        OUTPUT_DIR,
        "viewport",
        `${stem}.png`,
      );
      await page.screenshot({
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        path: viewportScreenshot,
      });
      if (CAPTURE_FULL_PAGE) {
        await page.screenshot({
          animations: "disabled",
          caret: "hide",
          fullPage: true,
          path: path.join(OUTPUT_DIR, "full-page", `${stem}.png`),
        });
      }

      results.push({
        ...measurement,
        consoleMessages,
        failedResources,
        httpErrors,
        label: LABEL,
        pageErrors,
        route: route.path,
        routeId: route.id,
        status: response?.status() ?? null,
        viewport,
        viewportScreenshot,
      });
    } catch (error) {
      results.push({
        consoleMessages,
        error: error instanceof Error ? error.message : String(error),
        failedResources,
        httpErrors,
        label: LABEL,
        pageErrors,
        route: route.path,
        routeId: route.id,
        viewport,
      });
    } finally {
      await page.close();
    }
  }

  await context.close();
}

await browser.close();


function isCloudflareChallengeUrl(url) {
  return /challenges\.cloudflare\.com|turnstile|\/cdn-cgi\/challenge/i.test(
    url,
  );
}

function isFirstPartyHttpError(entry, baseUrl) {
  if (isCloudflareChallengeUrl(entry.url)) return false;
  try {
    const origin = new URL(baseUrl).origin;
    const url = new URL(entry.url);
    return url.origin === origin || url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return true;
  }
}

function isVendorConsoleError(message, httpErrors, baseUrl) {
  const text = message.text ?? "";
  if (/\[Cloudflare Turnstile\]|Turnstile Error: 110200|challenges\.cloudflare\.com/i.test(text)) {
    return true;
  }
  if (
    message.type === "error" &&
    /Failed to load resource: the server responded with a status of \d+/i.test(text)
  ) {
    const firstParty = (httpErrors ?? []).filter((entry) =>
      isFirstPartyHttpError(entry, baseUrl),
    );
    return firstParty.length === 0;
  }
  return false;
}

const summary = {
  baseUrl: BASE_URL,
  cases: results.length,
  errors: results.filter((result) => result.error).length,
  h1ContractFailures: results.filter((result) => {
    if (!result.h1) return true;
    const width = result.viewport.width;
    const range = width >= 1024 ? "desktop" : width >= 768 ? "tablet" : "mobile";
    const route = ROUTES.find((candidate) => candidate.path === result.route);
    const maximum = route?.h1MaxLines?.[range] ?? (range === "mobile" ? 4 : 3);
    return result.h1.lineCount > maximum || result.h1.orphanFinalLine;
  }).length,
  horizontalOverflow: results.filter((result) => result.horizontalOverflow)
    .length,
  label: LABEL,
  pageOrConsoleErrors: results.filter(
    (result) =>
      result.pageErrors?.length > 0 ||
      result.consoleMessages?.some(
        (message) =>
          message.type === "error" &&
          !isVendorConsoleError(message, result.httpErrors, BASE_URL),
      ) ||
      (result.httpErrors ?? []).some((entry) =>
        isFirstPartyHttpError(entry, BASE_URL),
      ),
  ).length,
  consoleWarnings: results.reduce(
    (count, result) =>
      count +
      (result.consoleMessages?.filter((message) => message.type === "warning")
        .length ?? 0),
    0,
  ),
  textFloorFailures: results.filter(
    (result) =>
      result.meaningfulTextViolations?.length > 0 ||
      result.bodyTextViolations?.length > 0,
  ).length,
  viewports: VIEWPORTS,
};

await writeFile(
  path.join(OUTPUT_DIR, `${LABEL}-results.json`),
  JSON.stringify({ summary, results }, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

if (
  summary.errors > 0 ||
  summary.h1ContractFailures > 0 ||
  summary.horizontalOverflow > 0 ||
  summary.pageOrConsoleErrors > 0 ||
  summary.textFloorFailures > 0
) {
  process.exitCode = 1;
}
