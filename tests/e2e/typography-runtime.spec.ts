import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/release-fixture";

const coreRoutes = [
  "/",
  "/archivio",
  "/toools/blink",
  "/shortlist",
  "/compare",
  "/radar",
  "/account",
] as const;

const fallbackRoutes = ["/", "/archivio", "/toools/blink", "/compare"] as const;

const releaseViewports = [
  { name: "mobile-320", width: 320, height: 740 },
  { name: "desktop-1440", width: 1440, height: 1000 },
] as const;

const fontAssetPattern =
  /^\/_next\/static\/media\/[^/]+\.(?:woff2?|ttf|otf)$/i;

const interactiveSelector = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='searchbox']",
  "[role='spinbutton']",
  "[role='switch']",
  "[role='tab']",
].join(",");

type TypographyViolation = {
  element: string;
  fontFamily: string;
  fontSize: number;
  text: string;
};

type ClsRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type ClsShiftDetail = {
  sources: Array<{
    currentRect: ClsRect;
    previousRect: ClsRect;
    selector: string;
  }>;
  startTime: number;
  value: number;
};

type ClsHarness = {
  read: () => {
    largestShifts: ClsShiftDetail[];
    supported: boolean;
    value: number;
  };
};

function isFontRequest(url: string, resourceType: string) {
  return (
    resourceType === "font" ||
    /\.(?:woff2?|ttf|otf)(?:$|[?#])/i.test(url)
  );
}

async function installClsObserver(page: Page) {
  await page.addInitScript(() => {
    type LayoutShiftEntry = PerformanceEntry & {
      hadRecentInput: boolean;
      sources?: Array<{
        currentRect: DOMRectReadOnly;
        node: Node | null;
        previousRect: DOMRectReadOnly;
      }>;
      value: number;
    };

    let currentWindowStart = 0;
    let currentWindowValue = 0;
    let lastShiftTime = 0;
    let maximumWindowValue = 0;
    let largestShifts: ClsShiftDetail[] = [];

    const summarizeRect = (rect: DOMRectReadOnly): ClsRect => ({
      height: Number(rect.height.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      x: Number(rect.x.toFixed(2)),
      y: Number(rect.y.toFixed(2)),
    });

    const describeNode = (node: Node | null) => {
      if (!(node instanceof Element)) return node?.nodeName ?? "unknown";

      const parts: string[] = [];
      let element: Element | null = node;
      while (element && element !== document.documentElement && parts.length < 4) {
        let part = element.tagName.toLowerCase();
        if (element.id) {
          part += "#" + CSS.escape(element.id);
          parts.unshift(part);
          break;
        }

        const classes = Array.from(element.classList)
          .slice(0, 2)
          .map((className) => "." + CSS.escape(className))
          .join("");
        part += classes;
        const sameTagSiblings = element.parentElement
          ? Array.from(element.parentElement.children).filter(
              (sibling) => sibling.tagName === element?.tagName,
            )
          : [];
        if (sameTagSiblings.length > 1) {
          part += ":nth-of-type(" + (sameTagSiblings.indexOf(element) + 1) + ")";
        }
        parts.unshift(part);
        element = element.parentElement;
      }

      return parts.join(" > ");
    };

    const recordEntries = (entries: PerformanceEntry[]) => {
      for (const performanceEntry of entries) {
        const entry = performanceEntry as LayoutShiftEntry;
        if (entry.hadRecentInput) continue;

        const detail: ClsShiftDetail = {
          sources: (entry.sources ?? []).map((source) => ({
            currentRect: summarizeRect(source.currentRect),
            previousRect: summarizeRect(source.previousRect),
            selector: describeNode(source.node),
          })),
          startTime: Number(entry.startTime.toFixed(2)),
          value: Number(entry.value.toFixed(6)),
        };
        largestShifts = [...largestShifts, detail]
          .sort((left, right) => right.value - left.value)
          .slice(0, 5);

        const startsNewWindow =
          currentWindowStart === 0 ||
          entry.startTime - lastShiftTime > 1_000 ||
          entry.startTime - currentWindowStart > 5_000;

        if (startsNewWindow) {
          currentWindowStart = entry.startTime;
          currentWindowValue = entry.value;
        } else {
          currentWindowValue += entry.value;
        }

        lastShiftTime = entry.startTime;
        maximumWindowValue = Math.max(
          maximumWindowValue,
          currentWindowValue,
        );
      }
    };

    const supported =
      "PerformanceObserver" in window &&
      PerformanceObserver.supportedEntryTypes.includes("layout-shift");
    const observer = supported
      ? new PerformanceObserver((entryList) => {
          recordEntries(entryList.getEntries());
        })
      : null;

    observer?.observe({ type: "layout-shift", buffered: true });

    const harness: ClsHarness = {
      read: () => {
        if (observer) recordEntries(observer.takeRecords());
        return {
          largestShifts,
          supported,
          value: maximumWindowValue,
        };
      },
    };

    Object.defineProperty(window, "__tooolvibesTypographyCls", {
      configurable: false,
      value: harness,
    });
  });
}

async function navigateAndSettle(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });

  expect(response, `${path} did not return a document response`).not.toBeNull();
  expect(response?.status(), `${path} returned an unexpected status`).toBeLessThan(
    400,
  );
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator("#main-content")).not.toBeEmpty();
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  await page.waitForTimeout(100);
}

async function readCls(page: Page) {
  return page.evaluate(() => {
    const runtimeWindow = window as typeof window & {
      __tooolvibesTypographyCls?: ClsHarness;
    };
    return (
      runtimeWindow.__tooolvibesTypographyCls?.read() ?? {
        largestShifts: [],
        supported: false,
        value: Number.POSITIVE_INFINITY,
      }
    );
  });
}

async function findTypographyViolations(page: Page) {
  return page.evaluate(
    ({ controlSelector }) => {
      const isScreenReaderOnly = (
        element: HTMLElement,
        style: CSSStyleDeclaration,
      ) => {
        const rect = element.getBoundingClientRect();
        const clipped =
          style.clip !== "auto" ||
          (style.clipPath !== "none" && style.clipPath !== "");
        return (
          clipped &&
          rect.width <= 1 &&
          rect.height <= 1 &&
          style.position === "absolute"
        );
      };

      const isVisible = (element: HTMLElement) => {
        if (
          element.closest(
            "[aria-hidden='true'],[hidden],[inert],script,style,template",
          )
        ) {
          return false;
        }

        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) === 0 ||
          isScreenReaderOnly(element, style)
        ) {
          return false;
        }

        if (
          typeof element.checkVisibility === "function" &&
          !element.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          })
        ) {
          return false;
        }

        return Array.from(element.getClientRects()).some(
          (rect) => rect.width > 0 && rect.height > 0,
        );
      };

      const hasDirectText = (element: HTMLElement) =>
        Array.from(element.childNodes).some(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            Boolean(node.textContent?.trim()),
        );

      const candidates = Array.from(
        document.body.querySelectorAll<HTMLElement>("*"),
      ).filter(
        (element) =>
          hasDirectText(element) || element.matches(controlSelector),
      );

      return candidates
        .filter(isVisible)
        .map((element) => {
          const style = getComputedStyle(element);
          const directText = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent?.trim() ?? "")
            .filter(Boolean)
            .join(" ");
          const text =
            directText ||
            element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            element.getAttribute("placeholder") ||
            element.tagName.toLowerCase();
          const classLabel =
            typeof element.className === "string"
              ? element.className
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((className) => `.${className}`)
                  .join("")
              : "";

          return {
            element: `${element.tagName.toLowerCase()}${
              element.id ? `#${element.id}` : ""
            }${classLabel}`,
            fontFamily: style.fontFamily,
            fontSize: Number.parseFloat(style.fontSize),
            text: text.replace(/\s+/g, " ").slice(0, 80),
          } satisfies TypographyViolation;
        })
        .filter(
          (entry) =>
            Number.isFinite(entry.fontSize) &&
            entry.fontSize > 0 &&
            entry.fontSize < 11.99,
        )
        .slice(0, 50);
    },
    { controlSelector: interactiveSelector },
  );
}

test("loads only the canonical local Next font assets at runtime", async ({
  baseURL,
  page,
}) => {
  expect(baseURL, "Playwright baseURL is required").toBeTruthy();
  if (!baseURL) return;

  const fontRequests = new Set<string>();
  page.on("request", (request) => {
    if (isFontRequest(request.url(), request.resourceType())) {
      fontRequests.add(request.url());
    }
  });

  await navigateAndSettle(page, "/");

  const runtimeFamilies = await page.evaluate(() => {
    const families: string[] = [];
    document.fonts.forEach((fontFace) => {
      families.push(fontFace.family);
    });
    return Array.from(
      new Set(
        families.map((family) =>
          family
            .replace(/^["']|["']$/g, "")
            .replace(/\s+Fallback$/i, ""),
        ),
      ),
    ).sort();
  });

  expect(runtimeFamilies).toEqual(["Inter", "Syne"]);
  expect(
    fontRequests.size,
    "The document did not request a canonical web-font asset.",
  ).toBeGreaterThan(0);

  const expectedOrigin = new URL(baseURL).origin;
  const invalidFontRequests = Array.from(fontRequests).filter((requestUrl) => {
    const url = new URL(requestUrl);
    return url.origin !== expectedOrigin || !fontAssetPattern.test(url.pathname);
  });

  expect(
    invalidFontRequests,
    `Unexpected font requests:\n${invalidFontRequests.join("\n")}`,
  ).toEqual([]);
});

for (const viewport of releaseViewports) {
  test(`keeps operational text at 12px and CLS within budget on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await installClsObserver(page);

    const typographyFailures: Array<{
      path: string;
      violations: TypographyViolation[];
    }> = [];
    const clsFailures: Array<{
      largestShifts: ClsShiftDetail[];
      path: string;
      supported: boolean;
      value: number;
    }> = [];

    for (const path of coreRoutes) {
      await navigateAndSettle(page, path);

      const violations = await findTypographyViolations(page);
      if (violations.length > 0) {
        typographyFailures.push({ path, violations });
      }

      const cls = await readCls(page);
      if (!cls.supported || cls.value > 0.1) {
        clsFailures.push({ path, ...cls });
      }
    }

    expect(
      typographyFailures,
      `Visible operational text below 12px at ${viewport.width}px:\n${JSON.stringify(
        typographyFailures,
        null,
        2,
      )}`,
    ).toEqual([]);
    expect(
      clsFailures,
      `CLS exceeded 0.1 at ${viewport.width}px:\n${JSON.stringify(
        clsFailures,
        null,
        2,
      )}`,
    ).toEqual([]);
  });

  test(`keeps content usable without font responses on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    let interceptedFontRequests = 0;
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (!isFontRequest(request.url(), request.resourceType())) {
        await route.fallback();
        return;
      }

      interceptedFontRequests += 1;
      await route.fulfill({
        status: 204,
        headers: {
          "cache-control": "no-store",
        },
      });
    });

    const failures: Array<{
      path: string;
      contentLength: number;
      horizontalOverflow: number;
      visibleControls: number;
    }> = [];

    for (const path of fallbackRoutes) {
      await navigateAndSettle(page, path);
      const result = await page.evaluate(
        ({ controlSelector }) => {
          const main = document.querySelector<HTMLElement>("#main-content");
          const visibleControls = Array.from(
            document.body.querySelectorAll<HTMLElement>(controlSelector),
          ).filter((element) => {
            if (typeof element.checkVisibility === "function") {
              return element.checkVisibility({
                checkOpacity: true,
                checkVisibilityCSS: true,
              });
            }
            const style = getComputedStyle(element);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              element.getClientRects().length > 0
            );
          }).length;
          const documentWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          );

          return {
            contentLength: main?.innerText.trim().length ?? 0,
            horizontalOverflow: Math.max(
              0,
              documentWidth - document.documentElement.clientWidth,
            ),
            visibleControls,
          };
        },
        { controlSelector: interactiveSelector },
      );

      if (
        result.contentLength === 0 ||
        result.visibleControls === 0 ||
        result.horizontalOverflow > 1
      ) {
        failures.push({ path, ...result });
      }
    }

    expect(
      interceptedFontRequests,
      "The fallback test did not intercept any font request.",
    ).toBeGreaterThan(0);
    expect(
      failures,
      `Font fallback regressions at ${viewport.width}px:\n${JSON.stringify(
        failures,
        null,
        2,
      )}`,
    ).toEqual([]);
  });
}
