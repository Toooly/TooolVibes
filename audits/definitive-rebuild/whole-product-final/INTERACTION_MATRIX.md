# Interaction acceptance matrix

Executed with Playwright against the production Next runtime. The preferred
`agent-browser` CLI was not installed in this environment, so the repository's
existing Playwright dependency provided the browser-equivalent fallback.
Machine-readable evidence is in `final/interaction-sweep.json`.

| Journey | Assertion | Result |
| --- | --- | --- |
| Desktop search | `Cmd/Ctrl+K` opens, Blink result appears, Escape closes | Pass |
| Mobile search | top-bar search opens, bottom nav is suppressed, Escape closes | Pass |
| Keyboard | skip link receives visible outline and focus ring | Pass |
| Utilities | sound and music controls change state | Pass |
| Saved | Blink persists after navigation and reload | Pass |
| Compare | one-candidate state renders | Pass |
| Compare | five-candidate maximum is enforced | Pass |
| Compare | selected candidates persist across navigation and reload | Pass |
| Compare | Blink uses the canonical editorial score | Pass |
| Saved suggestions | native disclosure starts collapsed | Pass |
| Archive URL state | query and group restore from the URL | Pass |
| Intro | cinematic does not mount away from Home | Pass |
| Account | public mobile bottom navigation is absent | Pass |
| Reduced motion | preference matches and zero animations remain running | Pass |
| Browser health | console and page errors | 0 |

State captures are in `after/states/`; the combined visual review is
`final/boards/10-fixed-surfaces-and-states.png`.
