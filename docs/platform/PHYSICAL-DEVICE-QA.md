# TooolVibes — Physical Device QA (required before GUI freeze)

Automated tests and browser emulation are NOT physical proof. Each box needs
a real device in hand. Record device model + OS + browser + SHA + pass/fail.

## A. iPhone Safari
- [ ] Header/content spacing, sticky tool nav (4 tabs, no scroll), sticky TOC.
- [ ] Compare: expanded → down-scroll compacts → up-scroll STAYS compact →
      top return STAYS compact → toggle re-opens. No flicker, no bounce expand.
- [ ] Save/Compare give NO sound, NO fake buzz. Visual pressed states excellent.
- [ ] Install sheet appears only when engaged, never on first paint;
      "Non ora" dismisses; steps text matches real Safari share sheet.
- [ ] Safe areas (notch/Dynamic Island), Safari chrome open/close (no jump),
      keyboard keeps fields visible, auth (magic link + OAuth) completes.
- [ ] **HAPTICS: NO fake haptic. NO crack sound. `unsupported` is correct.**

## B. iPhone Home Screen Web App
- [ ] Installed via share sheet; standalone full-screen, theme `#0b0620`.
- [ ] Install sheet NEVER shows when standalone.
- [ ] Same compare/nav/safe-area/keyboard/auth checks as A.
- [ ] **HAPTICS: NO fake generic haptic. NO crack sound. Standalone adds
      chrome, NOT Taptic capability.**

## C. iPhone native build (provisioned machine only)
- [ ] Shell loads pinned origin; ONE UI (no fork); external/affiliate links
      open in system browser with tracking intact; deep links route.
- [ ] Auth completes inside the shell without broken redirects.
- [ ] **HAPTICS: real Taptic test required physically** (selection/light/
      success/warning each felt). Build log is NOT proof.

## D. Android Chrome
- [ ] Same layout/compare/nav/safe-area/keyboard/auth checks as A.
- [ ] `beforeinstallprompt` sheet installs correctly (where offered).
- [ ] **HAPTICS: real vibration felt physically** on Save/Compare/success.

## E. Android installed PWA
- [ ] Standalone open; install sheet suppressed; same checks as D.
- [ ] **HAPTICS: real vibration felt physically.**

## F. Android native build (provisioned machine only)
- [ ] Same shell/deep-link/external/auth checks as C.
- [ ] **HAPTICS: native haptic felt physically.** Build log is NOT proof.

## G. Desktop Safari
- [ ] 1280/1440: command bar, tool nav grid, compare dock bottom-right,
      no overflow, keyboard/focus visible, auth completes.

## H. Desktop Chromium
- [ ] Same as G. DevTools device emulation may PRE-SCREEN but never signs off.
