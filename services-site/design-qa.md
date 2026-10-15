# Landing servizi — Design QA

Date: 2026-10-14

## Source truth

- Chatbot: `1-Foto-1.jpg`
- Social: `2-Foto-2.jpg`
- Web: `3-Foto-3.jpg`
- Direction retained: compact digital-device clusters, electric cyan/violet accents, orbital ribbons, selective particles, depth and immediate service recognition.
- Direction removed: poster copy, nested neon frames, repeated pills and uncontrolled glow.

## Implementation

- The canonical TooolVibes mark from `public/brand/tooolvibes-logo.png` is used throughout the services property; the former reconstructed SVG is removed.
- Three independent transparent WebP compositions are integrated as semantic, lazy-loaded imagery.
- Desktop and mobile use the same three image sources and the same hero/ecosystem components; responsive CSS changes only scale, placement and surrounding atmosphere.
- Each service scene now uses a section-specific ambient field, faint particles and controlled depth without enclosing the content in a card.
- The ecosystem retains the same three nodes but adds a central TooolVibes focal point, radial hierarchy and direct connections.
- All headings, service copy, labels and controls remain native HTML.
- The compositions use the existing landing palette and spacing system; no global platform styles or application bundles are shared.
- Motion is limited to a short viewport entrance and respects `prefers-reduced-motion`.

## Evidence

- Desktop comparison reviewed at 1280 × 900, 1440 × 1000 and 1728 × 1080 in the in-app browser.
- Mobile/tablet comparison reviewed at 390 × 844, 393 × 852, 430 × 932 and 768 × 1024 in the in-app browser.
- Automated responsive checks: 390, 393, 430, 768, 1280, 1440 and 1728 px.
- Final overflow: 0 px at every tested width.
- Asset loading: all three service visuals complete with responsive 640/1280 px sources.
- Browser console: no errors in the responsive pass.
- Isolation: no links to the main `tooolvibes.eu` property.

## Review

- Visual hierarchy: passed — service copy remains primary while the imagery and ambient fields read as one continuous scene.
- Reference fidelity: passed — the device/object language is clearly inherited without reproducing the poster layout.
- Typography and copy: passed — unchanged and fully code-native.
- Spacing and alignment: passed — mobile section height and dead space were reduced while preserving editorial breathing room.
- Color and glow: passed — cyan, violet and blue atmosphere now connects each scene to the canvas without increasing random neon.
- Responsive behavior: passed — no overflow, clipping or unreadable UI at the tested breakpoints.
- Accessibility: passed — meaningful alt text, reduced-motion support and unchanged semantic flow.
- Performance: passed — lazy-loaded WebP assets use responsive 640/1280 px sources; mobile variants are approximately 76–95 KB each after the richer reference-led effects pass.

final result: passed
