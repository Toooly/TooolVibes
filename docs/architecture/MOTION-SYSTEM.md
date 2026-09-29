# Motion System

## Canonical Tokens (styles/tokens.css)

- `--tv-duration-instant`: 80ms (hover)
- `--tv-duration-fast`: 120ms (click feedback)
- `--tv-duration-base`: 180ms (transitions)
- `--tv-duration-slow`: 240ms (base transitions)
- `--tv-duration-route`: 280ms (route crossfade)
- `--tv-duration-cinematic`: 360ms (modal/page)
- `--tv-easing-standard`: cubic-bezier(0.2, 0, 0, 1)
- `--tv-easing-spring-smooth`: cubic-bezier(0.45, 0, 0.15, 1)

## Tool Detail Overrides (to be unified)

- `--motion-fast`: 160ms → maps to `--tv-duration-fast` (120ms) or `--tv-duration-base` (180ms)
- `--motion-standard`: 210ms → maps to `--tv-duration-slow` (240ms)
- `--motion-expand`: 260ms → maps to `--tv-duration-route` (280ms)
- `--motion-ease`: cubic-bezier(0.2, 0.8, 0.2, 1) → maps to `--tv-easing-standard`

## Principles

- Motion communicates state, hierarchy, navigation, continuity
- No decorative entrance animations
- No bounce
- Respect prefers-reduced-motion
