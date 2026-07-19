import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  expect as playwrightExpect,
  test as playwrightTest,
  type ConsoleMessage,
  type Page,
} from "@playwright/test";

import { createProductHuntFixture } from "./product-hunt";

const hydrationPatterns = [
  /hydration/i,
  /hydrating/i,
  /server rendered html/i,
  /did not match/i,
  /text content does not match/i,
  /expected server html/i,
];

const ignoredConsoleErrorPatterns = [
  // Browser extensions and favicon requests are outside application ownership.
  /favicon\.ico/i,
  /extension:\/\//i,
];

const placeholderPng = readFileSync(
  resolve(process.cwd(), "public/brand/tooolvibes-logo.png"),
);

type BrowserIssue = {
  source: "console" | "pageerror" | "hydration";
  message: string;
};

function isIgnoredConsoleError(message: ConsoleMessage, browserName: string) {
  const text = message.text();
  if (ignoredConsoleErrorPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  return (
    browserName === "webkit" &&
    /Viewport argument key "interactive-widget" not recognized and ignored/i.test(
      text,
    )
  );
}

async function prepareDeterministicPage(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const fixedNow = Date.parse("2026-01-15T10:00:00.000Z");
    const NativeDate = Date;

    class FixedDate extends NativeDate {
      constructor(value?: string | number) {
        super(value ?? fixedNow);
      }

      static now() {
        return fixedNow;
      }
    }

    Object.defineProperty(window, "Date", {
      configurable: true,
      value: FixedDate,
    });
  });


  await page.route("**/*", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    if (requestUrl.pathname === "/api/product-hunt") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createProductHuntFixture(request.url())),
      });
      return;
    }

    if (request.resourceType() !== "image") {
      await route.continue();
      return;
    }

    const url = new URL(request.url());
    const isExternalHost = url.hostname !== "127.0.0.1" && url.hostname !== "localhost";
    const optimizedExternalImage =
      url.pathname === "/_next/image" &&
      /^https?:\/\//.test(url.searchParams.get("url") ?? "");

    if (!isExternalHost && !optimizedExternalImage) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: placeholderPng,
    });
  });
}

export const test = playwrightTest.extend<{ browserIssues: BrowserIssue[] }>({
  browserIssues: [
    async ({ page, browserName }, runFixture) => {
      const browserIssues: BrowserIssue[] = [];

      await prepareDeterministicPage(page);

      page.on("console", (message) => {
        const text = message.text();
        if (
          message.type() === "error" &&
          !isIgnoredConsoleError(message, browserName)
        ) {
          browserIssues.push({ source: "console", message: text });
        }

        if (hydrationPatterns.some((pattern) => pattern.test(text))) {
          browserIssues.push({ source: "hydration", message: text });
        }
      });

      page.on("pageerror", (error) => {
        browserIssues.push({
          source: hydrationPatterns.some((pattern) => pattern.test(error.message))
            ? "hydration"
            : "pageerror",
          message: error.stack ?? error.message,
        });
      });

      await runFixture(browserIssues);

      playwrightExpect(
        browserIssues,
        browserIssues
          .map((issue) => `[${issue.source}] ${issue.message}`)
          .join("\n\n"),
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export const expect = playwrightExpect;

export async function settleForScreenshot(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
}
