import { describe, expect, it } from "vitest";

import {
  MAGIC_LINK_EMAIL_CTA,
  MAGIC_LINK_EMAIL_SUBJECT,
  getMagicLinkHtml,
  getMagicLinkText,
} from "@/lib/auth/magic-link-email";

describe("magic-link email module", () => {
  const confirmUrl =
    "https://tooolvibes.eu/auth/callback?token_hash=ab&type=email";

  it("uses the live subject and CTA without password language", () => {
    const html = getMagicLinkHtml(confirmUrl);
    const text = getMagicLinkText(confirmUrl);

    expect(MAGIC_LINK_EMAIL_SUBJECT).toBe("Entra in TooolVibes");
    expect(MAGIC_LINK_EMAIL_CTA).toBe("Conferma e apri TooolVibes");
    expect(html).toContain(MAGIC_LINK_EMAIL_CTA);
    expect(html).toContain("Entra in TooolVibes");
    expect(html).toContain("#c9a227");
    expect(html).toContain("#08080a");
    expect(html.toLowerCase()).not.toContain("password");
    expect(text.toLowerCase()).not.toContain("password");
    expect(text).toContain(confirmUrl);
  });

  it("escapes the confirm URL in the href and HTML body", () => {
    const dirty =
      'https://tooolvibes.eu/auth/callback?token_hash=ab&type=email"><script>alert(1)</script>';
    const html = getMagicLinkHtml(dirty);

    expect(html).toContain(
      "https://tooolvibes.eu/auth/callback?token_hash=ab&amp;type=email",
    );
    expect(html).toContain("&quot;");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="' + dirty);
  });
});
