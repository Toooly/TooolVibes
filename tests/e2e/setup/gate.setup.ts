import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";

import { gateCookieName } from "@/lib/gate/constants";

const gateStorageState = "test-results/.auth/gate.json";

setup("authenticate the release fixture gate", async ({ baseURL, browser, request }) => {
  if (!baseURL) {
    throw new Error("Playwright baseURL is required for the gate fixture.");
  }

  const password =
    process.env.TOOOLVIBES_E2E_GATE_PASSWORD ?? "tooolvibes-e2e-gate-only";

  const response = await request.post("/api/gate", {
    data: { password },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ success: true });

  const setCookie = (await response.headersArray()).find(
    (header) =>
      header.name.toLowerCase() === "set-cookie" &&
      header.value.startsWith(`${gateCookieName}=`),
  )?.value;
  expect(setCookie, "The gate response did not set its session cookie.").toBeTruthy();
  if (!setCookie) return;

  const gateCookiePair = setCookie.split(";", 1)[0];
  const gateCookieValue = gateCookiePair.slice(gateCookieName.length + 1);
  const gateStatus = await request.get("/api/gate", {
    headers: { cookie: gateCookiePair },
  });
  expect(gateStatus.status()).toBe(200);
  expect(await gateStatus.json()).toEqual({ open: true });

  await mkdir("test-results/.auth", { recursive: true });
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: gateCookieName,
      value: gateCookieValue,
      url: baseURL,
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    },
  ]);
  await context.storageState({ path: gateStorageState });
  await context.close();
});
