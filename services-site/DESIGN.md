# TooolVibes Servizi — design contract

## Concept

**Orbital editorial system**: a quiet, premium digital studio built on open space, decisive typography and one continuous signal that connects conversations, content and web experiences.

The supplied JPGs are mood references only. The implementation preserves their dark/cyan/violet technology signal while removing poster density, decorative particles, nested frames, repeated pills and indiscriminate glow.

## Visual system

- Canvas: matte midnight `#050916` with navy depth, never pure black.
- Ink: warm white `#f4f0e8`; secondary copy `#aeb8cc`.
- Signals: cyan `#27d8ee`, violet `#875cff`, warm amber `#f7b84b` used only for a current/action state.
- Typography: local system grotesk stack; no remote font request and no layout shift.
- Grid: maximum 1440px, fluid gutters from 20px to 72px, 8px spacing base.
- Surfaces: open canvas first; one raised surface only where interaction needs containment.
- Borders: 1px cool-white at 12–18% opacity.
- Radius: 18px controls, 24px purposeful frames, circular signal nodes.
- Glow: one active source per scene; ambient bloom stays below content contrast.
- Shadow: deep neutral shadow, never a neon outline.

## Motion language

- Slow orbital drift for context, sequential state change for meaning.
- Chat: request → classification → response → action.
- Social: identity → content → calendar → publication.
- Web: wireframe → page → responsive viewport → action.
- No scroll hijacking. All motion uses opacity/transform and stops under `prefers-reduced-motion`.

## Responsive rules

- Desktop scenes use asymmetric editorial compositions.
- Tablet reduces orbit radius and preserves readable UI fragments.
- Mobile re-composes each scene vertically; it does not shrink desktop or turn every section into identical cards.
- Minimum touch target: 44px. Primary controls: 48px or more.
- No horizontal scrolling at 320–1440px.

## CTA hierarchy

- Primary copy everywhere: **Parliamo del tuo progetto**.
- Secondary hero action: **Scopri cosa possiamo costruire**.
- The form is the only final conversion surface.

## Concept sources

Six coordinated ImageGen studies were created and visually reviewed before implementation: desktop hero, the three service scenes, process/contact and mobile hero. They remain local design artifacts; the production experience reconstructs their useful spatial language as semantic HTML, CSS and SVG rather than shipping rasterized sections.
