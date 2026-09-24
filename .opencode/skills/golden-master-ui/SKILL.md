# golden-master-ui

Reconstruct production UI from Golden Master PNGs without reinterpretation.

## Rules

- The Golden Master image is the immutable presentation specification.
- Spec sources: `.opencode/golden-masters/*.png` (project-local copies).
- Verify real image vision before implementing: the agent MUST be able to
  receive PNG pixels (webfetch of a locally served PNG, Read image input,
  or equivalent). If the image tool fails, STOP — do not reconstruct
  from OCR/DOM/coordinates.
- Preserve business logic, routing, data, auth, persistence.
- Component/DOM anatomy may be rebuilt to match the image.
- Never "improve", "modernize", "simplify", or make a "similar" version.
- Never preserve a wrong layout merely because it works.
- Dynamic data may vary; the component contract (density, hierarchy,
  placement) must not drift.
- Mobile reference viewport is 390x844 unless the task states otherwise.
- Loop: screenshot at 390x844 -> visually inspect -> list concrete
  mismatches -> edit canonical components -> re-render -> compare again.
- OCR, DOM coordinates, CSS token matches, style gates, and test results
  are QA supplements. They are NEVER substitutes for visual comparison.
- Acceptance: without labels, a person immediately recognizes
  implementation and Golden Master as the same interface. Otherwise keep
  correcting.
- Missing official imagery = ASSET BLOCKER. Document it; never fabricate
  product media, provider integrations, URLs, or catalog metadata.
