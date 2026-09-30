# TooolVibes — Haptics (implemented reality)

## API

`lib/feedback` exposes `feedback.selection/light/medium/success/warning/error()`.
`lib/haptics` is a thin compat re-export (legacy `triggerHaptic`/`haptic` names,
legacy `"native-bridge"` result string). New code imports `@/lib/feedback`.

## Routing

1. Registered native bridge (`registerNativeFeedbackBridge`) → `"native"`.
2. `navigator.vibrate` with centralized patterns → `"vibration"`.
   selection [8], light [12], medium [20], success [15,40,15],
   warning [10,30,10], error [25,40,25]. Components never invent arrays.
3. Otherwise → `"unsupported"` silent no-op. Visual pressed/active states
   carry the interaction.

## Policy (restrained + premium)

YES: Save toggle (success), Compare add/remove (selection),
pull-refresh threshold + armed tick, success/warning/error confirmations,
important segmented selection/toggles.
NO: scroll, ordinary links/cards, carousel, passive reading, accordions,
bottom-nav taps, every navigation tap.

## Platform behavior

- iOS Safari: `unsupported`, no audio, no exception, no false success claim.
- iOS Home Screen PWA: same as Safari — installation adds app-like chrome,
  safe areas, standalone UX; it does NOT enable programmable Taptics.
- Android web/PWA: real `navigator.vibrate` with the centralized patterns.
- Native (when shell exists): `@capacitor/haptics` mapping —
  selection→`selectionChanged`, light/medium→`impact`,
  success/warning/error→`notification`, plus `vibrate` for patterns.
  Overuse forbidden; mapping table lives in the shell bootstrap.

## Static counts (post-migration)

- Direct `navigator.vibrate` outside canonical services: **0**
  (only `lib/feedback` + legacy `__tests__/lib/haptics.test.ts` mocks).
- AudioContext/oscillator/Audio haptic hacks: **0**.
- Hidden-switch hacks: **0**.
- `navigator.userAgent` in components/app/lib: **0**
  (only UA-independent inference inside `lib/platform`).
