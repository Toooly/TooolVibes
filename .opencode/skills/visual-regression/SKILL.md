# visual-regression

Trustworthy visual QA for Golden Master reconstruction.

## Requirements

- Same viewport (390x844 mobile reference), same DPR, same scrollY (0),
  same route, same application/fixture state for both captures.
- Wait for fonts (`document.fonts.ready`), hydration markers, and CSS
  before capturing.
- Never reuse screenshots from older SHAs. Every capture must be fresh
  from the current HEAD.
- Produce side-by-side pairs: LEFT = Golden Master, RIGHT = implementation,
  same physical size, same scale, same crop convention.
- Distinguish legitimate dynamic-content deltas (real data varying) from
  layout regressions (component contract drift).
- No similarity score (SSIM/OCR/coordinate match) constitutes approval.
  A vision-capable reviewer decides.
