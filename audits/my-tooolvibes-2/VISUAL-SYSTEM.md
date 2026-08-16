# Signal visual system

Not Lucide-in-circle. Native SVG + CSS. Dark certified tokens only.

## Grammar

Five primitives, reused everywhere:

1. **Beacon** — single node + pulse ring (first trace, current mission)
2. **Route** — two nodes + a path (comparison, pathfinder)
3. **Layers** — stacked offset nodes (stack, builder)
4. **Rings** — concentric radar (return, weekly activity)
5. **Mesh** — sparse coordinate grid (cartographer, cabinet field)

Rarity = geometry density + stroke weight, not color alone.
State = stroke style: locked = 30% outline; nearby = dashed; earned = filled.

## Marks → primitive

| code | primitive |
|---|---|
| first_signal | Beacon |
| profile_set | Beacon + small coordinate tick |
| first_verdict | Route converging |
| pathfinder | Route with a fork |
| stack_builder | Layers |
| radar_return | Rings |
| curator_mark | Layers + route |
| strategist | Locked convergence (route + lock node) |
| cartographer | Mesh |

Level emblems: same five primitives, larger, used as map territories.

## Signal Map (conditional)

Desktop/tablet: five rings, current level filled, next dashed.
390px: collapse to a horizontal rail of 5 emblems + progress bar. If the ring map overflows or feels gamey in QA, keep the rail only.

## Motion

Use existing motion primitives. Pulse only on earned/nearby. Honor `prefers-reduced-motion` and `reduceRewardAnimations` / quietMode.

## CSS

New classes under `app/(marketing)/account/account.css` + a dedicated `components/signal/marks/signal-marks.css` if the file would bloat account.css.

No ivory. No neon. No `styles/account.css` !important.
