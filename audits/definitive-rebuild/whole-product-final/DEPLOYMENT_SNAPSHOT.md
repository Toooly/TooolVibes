# Deployment snapshot

Status: **deployed and verified**

| Field | Value |
| --- | --- |
| Production URL | `https://tooolvibes.square-shape-3527.workers.dev` |
| Verified at | `2026-07-26T11:14:29.363Z` |
| Deployed source head | `ea440e24ebd21cb0e5d6ed19923adb9a8f293a8b` |
| Active Worker version | `df6a14b9-237f-43bc-8b04-0415d1182c4b` at 100% |
| OpenNext build ID | `fspNfTxmFfodWuT6A9ULV` |
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

- `app/(marketing)/archivio/page-f06dcde41eb40132.js`
- `app/(marketing)/layout-37bdbd58cedc8b72.js`
- `acf45067763195bd.css`
- `bb9bfb5a2f3b728a.css`
- `a33a396b72f24798.css`

These match the assets uploaded with the final OpenNext build. Complete
fingerprints and route results are in `final/production-verification.json`;
screenshots are in `final/production/` and review boards 13–14.

## Activation note

The adapter upload created the final Worker version but left traffic on the
previous version. Live verification detected the old asset fingerprint and a
500 on Collection Detail. The final version was then explicitly deployed at
100% with Wrangler and the entire production verification was rerun clean.

Wrangler emitted one non-blocking warning for a duplicate `popupElement` key in
generated `.open-next` bundle code. No application source contains that
duplicate, and the deployed Worker reports zero browser/runtime errors across
the verified routes.
