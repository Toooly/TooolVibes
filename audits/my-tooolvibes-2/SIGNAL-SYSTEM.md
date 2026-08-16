# Signal system (canonical)

## Currency

Signal Points (SP) only. Server decides deltas. Client may not send `xpDelta`, `spDelta`, `points`, `newBalance`, `newLevel`.

## Levels (preserve)

1. Esploratore — 0
2. Selezionatore — 150
3. Builder — 400
4. Stratega — 900
5. Cartografo — 1800

## Events that earn (already server-capped)

Meaningful: first save, distinct saves (cap 3/day, once per slug), comparison completed (hash-deduped), collection progressed, radar return (1/day), profile completed, analysis read (once per slug).

Zero SP: unsave, comparison started, mission/achievement/level bookkeeping events.

Global daily SP cap: 120.

## Missions (preserve, refine copy toward value)

1. save_first_tool — start the map
2. complete_first_comparison — close a real choice
3. explore_first_collection — follow a path
4. return_to_radar — read current signals
5. complete_profile_context — teach the workspace

Do not add "open 10 pages" missions.

## Marks (preserve codes)

first_signal, profile_set, first_verdict, pathfinder, stack_builder, radar_return, curator_mark, strategist, cartographer.

Merged-into-mission marks must not double-grant SP (already encoded).

## Visual language (replace Lucide-in-circle)

Native SVG + CSS. Family: beacon, route, layered nodes, radar rings, locked convergence, abstract map.

States: locked (outline), nearby (dashed pulse), earned (filled mark), rare (denser geometry — not color alone).

Level emblems = five territories on a Signal Map (rings, not a game board). If the map fails mobile QA, keep emblems + compact rail.

Cabinet: earned + nearby (max ~2) + recent unlocks. Never 40 grey badges.

## Cadence

Active Weeks: a week counts if ≥1 meaningful server event. No punishment for absence. No freeze UX.

## Personal records (non-toxic)

decisions completed, comparisons completed, largest useful stack, radar active weeks, collection journeys. Hide zeros for new users.

## Quiet mode

Existing reward preferences. Settings → Segnale. Workspace remains fully useful with celebrations off.

## Legacy XP

Do not render GameProfileBar / XP / streak / daily missions / leaderboard on My TooolVibes.

Vibe Rush may appear as a personal record only, never as a competing level.

Do not flip production Signal flags in this pass unless already on; UI must be truthful when flags are off (no fake SP).
