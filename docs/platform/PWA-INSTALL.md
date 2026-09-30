# TooolVibes — PWA + Install (implemented reality)

## Manifest (`public/manifest.webmanifest`)

name, short_name TooolVibes, `start_url: /?source=pwa`, `scope: /`,
`display: standalone`, portrait-primary, night `#0b0620` theme+background,
icons 192+512 + maskable 192+512 (derived from canonical brand logo),
apple-touch 180 wired via `appleWebApp capable/title/black-translucent`.

## iOS education (`InstallExperience`, iOS manual surface)

"Porta TooolVibes sulla Home": 1) Tocca Condividi · 2) Aggiungi alla
schermata Home · 3) Conferma Aggiungi. Benefits listed (app-like open,
faster access, full-screen). NEVER claims haptics. Gate: iOS browser
context, not standalone/native, not dismissed within 21 days, engagement
(saved>=1 || compare>=1 || sessions>=3) — never on first-paint onboarding.

## Android (`android-prompt` surface)

Uses the real `beforeinstallprompt` (preventDefault → deferred → user
gesture `prompt()`). iOS instructions never shown on Android.

## Dismissal

"Non ora" persists `tooolvibes:install:dismissed:v1` (21-day cooldown).
Standalone/native suppress permanently; installing while open hides live
via display-mode listener.

## Service worker decision

No service worker is shipped. Installability on modern iOS/Android does
not require one for a server-rendered app, and an aggressive cache would
risk stale dynamic/private/account data. If push/offline ever ships, the
SW gets a versioned, scope-limited design — not a blind cache-all.
