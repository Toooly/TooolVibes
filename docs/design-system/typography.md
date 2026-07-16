# Typography release contract

Status: canonical foundation (B21 / DS-303)

## Downloaded families

TooolVibes downloads at most two global families:

- **Inter**: UI, body, navigation, controls, data labels and system/brand moments;
- **Fraunces**: selected editorial display headings only.

The former Manrope and Rubik roles alias to Inter through `--font-manrope` and
`--font-rubik`. These aliases keep legacy variable consumers stable without
requesting two additional font families. New code must use the semantic
`--tv-font-ui`, `--tv-font-system` and `--tv-font-display` tokens.

System fallbacks are part of the contract: Inter falls back to Segoe UI and a
generic sans-serif; Fraunces falls back to Georgia and a generic serif. Content
must remain readable if font files are unavailable.

## Type scale

| Token | Size | Intended use |
|---|---:|---|
| `--tv-text-xs` | 12px | shortest operational label; absolute minimum |
| `--tv-text-sm` | 14px | secondary UI and metadata |
| `--tv-text-md` | 16px | body and controls |
| `--tv-text-lg` | 18px | lead/supporting heading |
| `--tv-text-xl` | 24px | section heading |
| `--tv-text-2xl` | 32px | page heading |
| `--tv-text-3xl` | 48px | editorial display |

Operational text includes buttons, links, tabs, filters, form labels, status,
counts, metadata needed for a choice and data labels. It may not render below
12px at any supported viewport. Decorative marks without text semantics are not
type and must be hidden from assistive technology.

## Weight, line height and tracking

- body: 400/500, line height 1.58 to 1.7;
- controls and labels: 500/600, minimum 12px;
- headings: 600/700, line height 1.12 to 1.2;
- uppercase tracking is limited to short labels: 0.08em; eyebrow maximum 0.14em;
- long body copy uses default tracking.

## Change and QA policy

- Do not add another `next/font` family without bundle evidence and release-owner approval.
- Do not reference Manrope or Rubik by literal family name; legacy variables are compatibility-only.
- Font changes require the typography contract test, production build, font-request inspection and visual snapshots.
- Mobile and desktop QA must check truncation, control growth and wrapping after any type-size change.
- CLS must remain within the release budget; font fallback rendering is verified with font requests blocked.
