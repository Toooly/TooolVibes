# TooolVibes — Native Architecture (Capacitor, decision record)

## Decision (2026-09-30)

- Architecture **A**: Capacitor shell loading the canonical remote product
  origin (`https://tooolvibes.eu`), ONE UI / ONE data / ONE state / ONE
  graph / ONE motion. No static export, no SSR/cookie/API-route removal,
  no forked native UI, no dev live-reload URL in production.
- Capacitor version pinned at install time: **8.5.2** (latest stable,
  `npm view @capacitor/core` on 2026-09-30).

## Why no native projects are committed yet

Native `ios/` + `android/` projects require commit of generated native
shells plus local toolchain runs (`cap sync`, Xcode build, Gradle
assemble). On this machine BOTH toolchains are absent:

- iOS: `xcodebuild` shim exists but active developer dir is
  CommandLineTools only — **no Xcode.app, no iOS SDK, no Simulator**.
- Android: **no SDK** (`ANDROID_HOME` unset, `~/Library/Android/sdk`
  absent), **no Java runtime**, **no Gradle**.

Committing `ios/` + `android/` without a single `cap sync` / compile
would be an unverified fiction. Per mission §54/§26 the correct move is
to document the blocker, ship the config + web-side bridge contract now,
and generate projects on a provisioned machine.

## What IS shipped now

1. `capacitor.config.ts` — appId `eu.tooolvibes.app`, appName TooolVibes,
   `webDir: "out"` placeholder (unused: remote-URL architecture needs no
   static export), `server.url` intentionally ABSENT (set per
   environment at sync time, never committed as a dev shortcut).
2. Web-side contracts the shell will consume on first sync:
   - `registerNativeFeedbackBridge({ feedback(intent) })` from
     `lib/feedback` — selection/light/medium/success/warning/error map
     1:1 to `@capacitor/haptics` (`Haptics.impact` / `Haptics.notification`
     / `Haptics.selectionChanged` / `Haptics.vibrate`).
   - `document.documentElement[data-tv-native=ios|android]` + `window.Capacitor`
     presence feed `getPlatformCapabilities()` (`lib/platform`).
   - External/affiliate links stay plain `_blank noopener (+sponsored)`;
     the shell opens them via `@capacitor/browser` (system browser),
     never trapped in-webview, tracking preserved.
   - Deep routes are plain App Router paths; the shell maps
     Universal Links / App Links to the same URLs.
3. Auth stays remote-cookie + PKCE; nothing about the native shell may
   break web auth.

## First-sync runbook (provisioned machine)

```bash
npm i @capacitor/core@8.5.2 @capacitor/cli@8.5.2 \
  @capacitor/haptics@8.5.2 @capacitor/app@8.5.2 \
  @capacitor/status-bar@8.5.2 @capacitor/keyboard@8.5.2 @capacitor/browser@8.5.2
npx cap init TooolVibes eu.tooolvibes.app
npx cap add ios && npx cap add android
# point shell at pinned origin per environment, then:
npx cap sync
# iOS: open ios/App in Xcode, build to Simulator/device (Taptic = physical only)
# Android: ./gradlew assembleDebug (vibration = physical only)
```

## Physical-haptics rule

No build log, no test suite, no emulation proves haptics. Taptic Engine
(iOS native), native vibration (Android native), `navigator.vibrate`
(Android web) each require the physical checklist in
`docs/platform/PHYSICAL-DEVICE-QA.md`.
