# TooolVibes — Capability Matrix (implemented reality)

Source: `lib/platform/capabilities.ts` + `lib/feedback/index.ts`.

| Capability | iPhone Safari | iOS Home-Screen PWA | iOS native shell | Android Chrome | Android PWA | Android native | Desktop |
|---|---|---|---|---|---|---|---|
| Product UI | full | full + standalone chrome | remote shell, same UI | full | full + install prompt path | remote shell, same UI | full |
| `supportsWebVibration` | false | false | false (bridge wins) | true | true | via bridge | false |
| `supportsNativeHaptics` | false | false | true (bridge) | false | false | true (bridge) | false |
| Feedback result | `unsupported` silent | `unsupported` silent | `native` Taptic | `vibration` | `vibration` | `native` | `unsupported` silent |
| Fake haptic / audio | FORBIDDEN | FORBIDDEN | n/a (real) | n/a | n/a | n/a (real) | FORBIDDEN |
| Install education | iOS 3-step sheet | suppressed (standalone) | suppressed (native) | `beforeinstallprompt` sheet | suppressed | suppressed | not shown |
| Push | n/a | where configured | native path | where configured | where configured | native path | n/a |
| Share sheet | `navigator.share` | `navigator.share` | native share | `navigator.share` | `navigator.share` | native share | conditional |
| Deep links | URL | URL | Universal Links | URL | URL | App Links | URL |
| Auth | cookie+PKCE | cookie+PKCE | remote session, same web flow | cookie+PKCE | cookie+PKCE | remote session, same web flow | cookie+PKCE |

Rules: feature detection first (`navigator.vibrate`, `matchMedia(display-mode)`,
`BeforeInstallPromptEvent`, bridge presence). UA inference only for the
iOS/Android label where no API answers. Standalone never implies haptics.
