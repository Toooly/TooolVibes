import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const profile = process.env.PLAYWRIGHT_E2E_PROFILE ?? "gated";

if (profile !== "gated" && profile !== "public") {
  throw new Error(`Unknown Playwright E2E profile: ${profile}`);
}

const isPublicProfile = profile === "public";
const gatePassword =
  process.env.TOOOLVIBES_E2E_GATE_PASSWORD ?? "tooolvibes-e2e-gate-only";
const e2eOrigin = new URL(baseURL);
const isLocalE2EOrigin =
  e2eOrigin.protocol === "http:" &&
  (e2eOrigin.hostname === "127.0.0.1" || e2eOrigin.hostname === "localhost");

if (!isLocalE2EOrigin && process.env.TOOOLVIBES_E2E_ALLOW_REMOTE !== "1") {
  throw new Error(
    `Refusing to run fixture-backed E2E tests against ${e2eOrigin.origin}. ` +
      "Set TOOOLVIBES_E2E_ALLOW_REMOTE=1 only for an approved disposable environment.",
  );
}
const sessionSecret =
  process.env.TOOOLVIBES_E2E_SESSION_SECRET ??
  "tooolvibes-e2e-session-secret-at-least-32-characters";
const gateStorageState = "test-results/.auth/gate.json";
const e2eRuntime = process.env.PLAYWRIGHT_RUNTIME ?? process.execPath;
const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const standaloneLauncher = resolve(
  process.cwd(),
  "scripts/release/start-standalone.mjs",
);
const nextCommand = `"${e2eRuntime}" "${nextCli}"`;
const startCommand = `"${e2eRuntime}" "${standaloneLauncher}"`;
const webServerCommand =
  process.env.PLAYWRIGHT_REUSE_BUILD === "1"
    ? startCommand
    : `${nextCommand} build && ${startCommand}`;
const webServerEnvironment = { ...process.env };
delete webServerEnvironment.NO_COLOR;

const smokeProjects = [
  {
    name: "chromium",
    testMatch: /(?:core-routes|security-boundaries)\.spec\.ts/,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1440, height: 1000 },
      storageState: gateStorageState,
    },
    dependencies: ["gate-setup"],
  },
  {
    name: "firefox",
    testMatch: /(?:core-routes|security-boundaries)\.spec\.ts/,
    use: {
      ...devices["Desktop Firefox"],
      viewport: { width: 1440, height: 1000 },
      storageState: gateStorageState,
    },
    dependencies: ["gate-setup"],
  },
  {
    name: "webkit",
    testMatch: /(?:core-routes|security-boundaries)\.spec\.ts/,
    use: {
      ...devices["iPhone 13"],
      viewport: { width: 390, height: 844 },
      storageState: gateStorageState,
    },
    dependencies: ["gate-setup"],
  },
];
const baselineProject = {
  name: "baseline",
  testMatch: /baseline-smoke\.spec\.ts/,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
  },
};

const visualProjects = [
  { name: "visual-320", viewport: { width: 320, height: 740 } },
  { name: "visual-430", viewport: { width: 430, height: 932 } },
  { name: "visual-1280", viewport: { width: 1280, height: 800 } },
  { name: "visual-1728", viewport: { width: 1728, height: 1000 } },
  { name: "visual-390", viewport: { width: 390, height: 844 } },
  { name: "visual-768", viewport: { width: 768, height: 1024 } },
  { name: "visual-1024", viewport: { width: 1024, height: 768 } },
  { name: "visual-1440", viewport: { width: 1440, height: 1000 } },
  { name: "visual-1920", viewport: { width: 1920, height: 1080 } },
].map(({ name, viewport }) => ({
  name,
  testMatch: /visual-matrix\.spec\.ts/,
  use: {
    ...devices["Desktop Chrome"],
    viewport,
    storageState: gateStorageState,
  },
  dependencies: ["gate-setup"],
}));
const typographyProject = {
  name: "typography-runtime",
  testMatch: /typography-runtime\.spec\.ts/,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
    storageState: gateStorageState,
  },
  dependencies: ["gate-setup"],
};


export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/artifacts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 60_000,
  reporter: process.env.CI
    ? [
        ["line"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.005,
    },
  },
  use: {
    baseURL,
    colorScheme: "dark",
    locale: "it-IT",
    timezoneId: "Europe/Rome",
    contextOptions: {
      reducedMotion: "reduce",
    },
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: isPublicProfile
    ? [baselineProject]
    : [
        {
          name: "gate-setup",
          testMatch: /gate\.setup\.ts/,
        },
        ...smokeProjects,
        {
          name: "shell-390",
          testMatch: /global-shell\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 390, height: 844 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "overflow-375",
          testMatch: /horizontal-overflow\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 375, height: 812 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "overflow-768",
          testMatch: /horizontal-overflow\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 768, height: 1024 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "overflow-1280",
          testMatch: /horizontal-overflow\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 1280, height: 800 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "overflow-1440",
          testMatch: /horizontal-overflow\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 1440, height: 900 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "touch-390",
          testMatch: /touch-interactions\.spec\.ts/,
          use: {
            ...devices["iPhone 13"],
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "scroll-restoration",
          testMatch: /scroll-restoration\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 390, height: 844 },
            storageState: gateStorageState,
          },
          dependencies: ["gate-setup"],
        },
        {
          name: "client-runtime",
          testMatch: /client-runtime-stability\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 390, height: 844 },
          },
        },
        ...visualProjects,
        typographyProject,
      ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    env: {
      ...webServerEnvironment,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN: baseURL,
      TOOOLVIBES_SECURITY_STATE_MODE: "memory",
      TOOOLVIBES_SECURITY_STATE_KEY_SECRET: sessionSecret,
      ALLOWED_AUTH_ORIGINS: baseURL,
      NEXT_TELEMETRY_DISABLED: "1",
      TOOOLVIBES_ALLOW_MOCK_DATA: "0",
      TOOOLVIBES_COLLECTIONS_SOURCE: "content",
      TOOOLVIBES_E2E_FIXTURES: isPublicProfile ? "0" : "1",
      TOOOLVIBES_PUBLIC_GATE_ENABLED: isPublicProfile ? "0" : "1",
      TOOOLVIBES_GATE_PASSWORD: gatePassword,
      TOOOLVIBES_SESSION_SECRET: sessionSecret,
      TOOOLVIBES_3D_ENABLED: "0",
      TOOOLVIBES_AUDIO_ENABLED: "0",
      TOOOLVIBES_GAMIFICATION_ENABLED: "0",
      TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED: "0",
      TOOOLVIBES_REWARD_BACKBONE_ENABLED: "0",
      TOOOLVIBES_GAME_MISSIONS_MODE: "OFF",
      TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE: "OFF",
      TOOOLVIBES_GAME_ARENA_MODE: "OFF",
      TOOOLVIBES_GAME_PREDICTION_MODE: "OFF",
      TOOOLVIBES_GAME_LEADERBOARD_MODE: "OFF",
      TOOOLVIBES_GAME_VIBE_RUSH_MODE: "OFF",
    },
  },
});
