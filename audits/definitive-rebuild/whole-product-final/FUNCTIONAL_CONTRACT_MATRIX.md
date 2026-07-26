# Functional contract matrix

The reconstruction changes presentation ownership without replacing existing
data, API, routing or persistence contracts.

| Contract | Preserved behaviour | Evidence |
| --- | --- | --- |
| Canonical tools | public tool repository remains the source; no invented tools | route tests and browser sweeps |
| Editorial score | canonical score is shared by Home, cards, detail and Compare; Blink is `8.4` | interaction sweep |
| Product Hunt | Radar renders live data only when available and an honest paused state otherwise | Radar captures |
| Archive state | search, category/group, tag and level remain URL-addressable | interaction sweep |
| Saved | existing local/account workspace persistence remains intact | interaction sweep |
| Compare | existing five-tool cap, removal and persistence remain intact | interaction sweep |
| Collections | bundled collection records and access/lock rules remain intact | route tests and captures |
| Account | existing guest/auth/admin contracts remain intact; public nav does not leak into account | route tests and sweep |
| Redirects | `/wishlist` and `/product-hunt` retain canonical aliases | route contract tests |
| APIs | no API route, Supabase contract, schema or data model changed | tracked diff review |
| Affiliate links | native link semantics and existing disclosure remain intact | focused card tests |
| Accessibility | semantic controls, visible keyboard focus, reduced motion and 44px touch targets | browser and style checks |

No dependency, database migration, API payload or route family was added.
