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
- All headings, service copy, labels and controls remain native HTML.
- The compositions use the existing landing palette and spacing system; no global platform styles or application bundles are shared.
- Motion is limited to a short viewport entrance and respects `prefers-reduced-motion`.

## Evidence

- Desktop comparison reviewed at 1440 × 1000 in the in-app browser.
- Mobile comparison reviewed at 390 × 844 in the in-app browser.
- Automated responsive checks: 375, 390, 430, 768, 1024, 1280, 1440 and 1728 px.
- Final overflow: 0 px at every tested width.
- Asset loading: all three service visuals complete with responsive 640/1280 px sources.
- Browser console: no errors in the responsive pass.
- Isolation: no links to the main `tooolvibes.eu` property.

## Review

- Visual hierarchy: passed — service copy remains primary and the imagery acts as a compact proof layer.
- Reference fidelity: passed — the device/object language is clearly inherited without reproducing the poster layout.
- Typography and copy: passed — unchanged and fully code-native.
- Spacing and alignment: passed — balanced on desktop and intentionally stacked on mobile.
- Color and glow: passed — concentrated on the service objects, restrained elsewhere.
- Responsive behavior: passed — no overflow, clipping or unreadable UI at the tested breakpoints.
- Accessibility: passed — meaningful alt text, reduced-motion support and unchanged semantic flow.
- Performance: passed — lazy-loaded WebP assets use responsive 640/1280 px sources; mobile variants are approximately 76–95 KB each after the richer reference-led effects pass.

final result: passed
