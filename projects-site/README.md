# TooolVibes · Progetti su misura

Independent commercial landing for e-commerce, app creation and custom software.
Target: `https://progetti.tooolvibes.eu`; Worker: `tooolvibes-progetti`.

## Isolation

This directory is an independent snapshot of the approved services landing. It has its
own HTML, CSS, script, assets, API, form schema, analytics event names, metadata,
privacy page, email templates, Turnstile action, rate-limit namespaces and deployment.
No runtime imports, redirects, links or relay requests point to the existing services
landing or to the main platform. Changes here cannot modify their deployed bundles.

## Design contract

- Preserve the accepted header, two-part hero, scroll-paced service explorer, three
  service scenes, guided method, contextual notices and progressive contact form.
- Keep `#050916` navy-black, original logo, existing system typography and spacing,
  blue `#6fa9ff`, violet `#c195ff`, mint `#70e4af`, and the existing CTA treatment.
- One generated illustration per service, reused in explorer and service section at
  every breakpoint. WebP widths 640/1280; no mobile-only artwork. Image Gen supplied
  coordinated storefront, app-booking and operational-software concepts; UI labels,
  pricing, controls, form and motion remain native code.
- Existing low-cost offers, inherited numeric scarcity and their deadlines are not
  offers for this separate property. All project start dates are to be agreed.
- External illustrations are illustrative, never presented as client case studies.

## Pricing rationale — checked 22 October 2026

Launch prices: e-commerce **from EUR 2,490**, first app release **from EUR 8,900**,
first custom-software module **from EUR 11,900**. Scope is explicitly bounded in each
offer and confirmed in the quote. No recurring fee, delivery deadline or unlimited
scope is invented.

The old prices of this business were not supplied. The landing consequently does
not fabricate crossed-out former prices or percentages. Links identify external
published references, not a representative market average or equivalent quotations:

- DSI Design: Shopify starter up to 50 products **from EUR 3,500**; WooCommerce
  standard **EUR 5,500**: https://www.dsidesign.it/ecommerce-roma/
- Federico Tassara: cross-platform mobile MVP **EUR 15,000–40,000**; the chosen app
  platform and scope can differ: https://federicotassara.com/blog/quanto-costa-app-mobile-italia-2026
- Antha: minimum software/MVP **EUR 5,000–15,000**, not a claim that our launch price
  undercuts the entire range: https://antha.it/blog/quanto-costa-un-software-su-misura/

## Development and checks

Run from the repository root:

```sh
npm run projects:dev
npm run projects:typecheck
npm run projects:test
npm run projects:dry-run
```

The form guide is usable without provider credentials, but actual submission fails
closed. Unit tests mock Turnstile and Resend; they are not proof of live delivery.
The local example uses only the official Cloudflare test pair, with no mail key.

## Local acceptance — 22 October 2026

- 40 focused tests; original services landing: 101 regression tests. TypeScript,
  ESLint and the isolated Cloudflare deploy dry-run pass. Worker bundle: 5.59 KiB gzip.
- Real browser inspection at 390, 430, 768 and 1440 px: hero, all three service
  artworks, launch offers, explorer selection and guided contact flow. No horizontal
  overflow, missing visible images or browser console errors/warnings were observed.
- Lighthouse local mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.4 s, CLS 0, TBT 0 ms. These are local, not production results.
- Fidelity review: original composition and typography retained; navy/cyan/violet/mint
  palette preserved; each service has one responsive artwork source; source scenes
  and final screenshots were visually inspected; scroll pacing and reduced-motion
  fallback retained. New preview scene wrappers and narrow pricing columns were
  corrected during browser QA. The explorer's visible label is its accessible name.
- Cloudflare target account and active `tooolvibes.eu` zone verified read-only; no
  existing DNS record or widget for `progetti.tooolvibes.eu`. No existing DNS, email
  configuration, Worker or production bundle was changed during preparation.

## Production release — 22 October 2026; HTTPS rechecked 23 October

- Live at `https://progetti.tooolvibes.eu`, isolated Worker `tooolvibes-progetti`.
  Runtime commit `ac234b15`; Cloudflare version `2f1eb0c3-a32e-4b21-ba71-5a283a72c04f`.
  Custom domain only; workers.dev and preview URLs disabled. DNS/TLS and public
  metadata/security headers verified; live CSS and JavaScript match committed files.
- Dedicated hostname-only managed Turnstile widget and domain-scoped Resend sending
  key configured. All three bindings are encrypted Worker secrets, not repository
  files. Existing email DNS, services landing and main Worker were not changed.
- One real browser submission passed Turnstile and displayed success. Resend shows
  delivery to all three internal recipients and delivery of the branded acknowledgment.
  Sender and Reply-To were verified in Resend. This proves provider delivery, not
  inbox placement; no recipient inbox was accessed. Do not repeat the test casually.
- Missing and invalid Turnstile tokens both returned HTTP 400 `verification_required`.
- Production Lighthouse mobile: Performance 94, Accessibility 100, Best Practices 81,
  SEO 100; LCP 1.3 s, CLS 0.012, TBT 290 ms. The Best Practices deduction is from
  deprecated APIs in Cloudflare's injected challenge-platform script. No security
  protection was disabled to improve this score. No application console errors or
  failed requests were reported by the audit.
- Safari live inspection completed at 390, 430 and 768 px, including explorer,
  service navigation, method and the real contact flow. Local 1440 px inspection
  passed; final live 1440 px visual inspection remains pending because the Mac locked.
- On 23 October, projects, services and the main platform all returned HTTPS 200;
  `/api/config` reported the new form available. This is a public smoke check, not
  an authenticated regression test of the main platform.

## Production prerequisites

1. Verify the Cloudflare account/zone and absence of an existing conflicting record
   for `progetti.tooolvibes.eu`. Do not change records for other properties.
2. Create a dedicated managed Turnstile widget allowing only this hostname; set its
   public site key in `wrangler.jsonc`. Keep `projects_contact` as the action.
3. Configure a domain-scoped sending key and secrets on `tooolvibes-progetti` using
   Cloudflare primitives, never committed files or command arguments:
   `RESEND_API_KEY`, `PROJECTS_TURNSTILE_SECRET_KEY`, `PROJECTS_NOTIFY_EMAIL`.
4. Notify `gianmariacaltag@gmail.com,mattia02.baldo@gmail.com,Teodoro.piergiorgi@gmail.com`
   through the server-only recipient secret. Sender stays `info@tooolvibes.eu`;
   validated lead email is Reply-To. The acknowledgment uses this site's origin.
5. Preserve the working email DNS; do not create new mailboxes or change MX/SPF.
6. `npm run projects:deploy` checks exact target, non-test widget, main, committed
   project changes and matching remote SHA before invoking the isolated deployment.
7. Verify DNS/TLS, real contact delivery, confirmation, rejected invalid tokens and
   desktop/mobile production behavior before claiming LIVE VERIFIED.
