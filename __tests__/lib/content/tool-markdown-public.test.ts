import { describe, expect, it } from "vitest";

import {
  parsePublicToolMarkdown,
  stripInternalToolMarkdown,
} from "@/lib/content/tool-markdown-public";

const SAMPLE = `## Overview approfondita

Testo pubblico.

## CTA e stati

Non mostrare questo blocco interno.

## Ideale per

- Founder early-stage.

## Alternative

- Altro tool.

## FAQ

**Domanda?**
Risposta.
`;

describe("stripInternalToolMarkdown", () => {
  it("removes the CTA e stati heading and body", () => {
    const stripped = stripInternalToolMarkdown(SAMPLE);
    expect(stripped).not.toMatch(/CTA e stati/);
    expect(stripped).not.toMatch(/Non mostrare questo blocco interno/);
    expect(stripped).toMatch(/Testo pubblico/);
    expect(stripped).toMatch(/## FAQ/);
  });
});

describe("parsePublicToolMarkdown", () => {
  it("does not expose CTA e stati as a public section", () => {
    const parsed = parsePublicToolMarkdown(SAMPLE);
    expect(parsed.byId.overview).toContain("Testo pubblico");
    expect(parsed.byId.faq).toContain("Domanda?");
    expect(parsed.byId.fit).toContain("Founder");
    expect(parsed.stripped).not.toMatch(/CTA e stati/);
    expect(Object.values(parsed.byId).join("\n")).not.toMatch(/blocco interno/);
  });
});
