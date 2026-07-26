# Deployment snapshot

Status: **deployed and verified**

| Field | Value |
| --- | --- |
| Production URL | `https://tooolvibes.square-shape-3527.workers.dev` |
| Verified at | `2026-07-26T18:33:40Z` |
| Deployed source head | `7fc00651f3667fc57baa4eb1fa23878dce1b1ea3` |
| Active Worker version | `a55600ac-22ce-41cb-8f10-8cd8971ab796` at 100% |
| OpenNext build ID | `cKDoonnObPfd7iVnZW5je` |
| Wrangler / adapter | Wrangler `4.111.0`, `@opennextjs/cloudflare` `1.20.1` |

## Live verification

Nine primary routes were rendered in Chromium at 390×844 and 1440×900.

| Assertion | Result |
| --- | ---: |
| Route/viewport checks | 18 |
| Non-200 responses | 0 |
| Missing main landmarks | 0 |
| Horizontal overflows | 0 |
| Console errors | 0 |
| Page errors | 0 |
| JavaScript/CSS asset errors | 0 |
| Intro shown outside Home | 0 |
| Home intro dismissal failures | 0 |
| Responsive shell violations | 0 |

The live route and CSS fingerprints include:

- `app/(marketing)/radar/page-99cb95b7a5a9adae.js`
- `app/(marketing)/toools/%5Bslug%5D/page-2c62b1ec07ffe6bc.js`
- `webpack-9f77a30aa40f768b.js`
- `166577cf87a7be1f.css`
- `d39112fe08a65cdd.css`

These match the assets uploaded with the final OpenNext build. Complete
fingerprints and route results are in `final/production-verification.json`;
screenshots are in `final/production/` and review boards 13–14.

## Activation note

The version promoted manually at 15:50 UTC used Wrangler full minification and
returned 500 responses because the generated middleware manifest loader had
been rewritten unsafely. Traffic was restored to the stable Worker, the
OpenNext output was given a deterministic build-time compatibility patch, and
the corrected bundle was deployed directly. Collection Detail was also moved
to explicit dynamic rendering and fixed-shell/archive link prefetch was
disabled to prevent SSR request storms. The final version above is active at
100% and the complete production verification was rerun clean.

Wrangler emitted one non-blocking warning for a duplicate `popupElement` key in
generated `.open-next` bundle code. Chromium also reports only the existing
`THREE.Clock` deprecation warning. No application source contains the duplicate
key, and the deployed Worker reports zero browser/runtime errors across the
verified routes.

## Custom domain routing

`tooolvibes.eu` is not attached to this Worker in the authenticated Cloudflare
account and belongs to a different zone/account context. The definitive build
is therefore live and verified at the Worker URL above; making the same version
visible on the custom domain still requires routing that external zone to this
Worker.
