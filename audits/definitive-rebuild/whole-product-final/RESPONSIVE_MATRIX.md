# Responsive acceptance matrix

Validated on the production Next runtime at `http://127.0.0.1:3200` on
2026-07-26. Raw measurements and per-route results are in
`final/responsive-sweep.json`; full-page captures are in `final/raw/`.

## Coverage

| Band | Widths | Shell contract | Result |
| --- | --- | --- | --- |
| Narrow mobile | 360, 390 | mobile top and bottom shell, single column | Pass |
| Wide mobile | 430 | mobile shell, compact horizontal groups | Pass |
| Tablet | 768, 820, 912, 1024 | mobile shell, route-specific hybrid layout | Pass |
| Compact desktop | 1180, 1279 | mobile shell with expanded route canvas | Pass |
| Full desktop | 1280, 1366, 1440, 1536, 1920 | desktop Command Bar and desktop architecture | Pass |

Nine primary routes were checked at all 14 widths: Home, Archive, Tool Detail,
Radar, Compare, Saved, Collections, Collection Detail and Account.

| Automated assertion | Total |
| --- | ---: |
| Route/width checks | 126 |
| Non-200 responses | 0 |
| Horizontal overflows | 0 |
| Console errors | 0 |
| Page errors | 0 |
| Asset errors | 0 |
| Clipped controls | 0 |
| Main text below the 12px floor | 0 |
| Account navigation violations | 0 |

## Visual review

- `final/boards/01-global-shell.png` verifies desktop/mobile shell ownership.
- `final/boards/02-home.png` through `08-collections.png`, plus
  `11-collection-detail.png` and `12-account.png`, verify route hierarchy.
- `final/boards/09-responsive-contact-sheet.png` shows every required width.
- `after/primary-*.png` and `after/secondary-*.png` cover all public route
  families at desktop and mobile.
- All review boards and route boards were inspected visually after the final
  interaction pass.

The shell changes at 1280px by design. Fixed navigation consumes canonical safe
area variables, and no route introduces an independent bottom offset.
