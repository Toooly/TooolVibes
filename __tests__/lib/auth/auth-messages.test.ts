import { describe, expect, it } from "vitest";

import {
  isAuthFailureMessage,
  mapAuthProviderError,
} from "@/lib/auth/auth-messages";

describe("auth messages", () => {
  it("treats oauth open failures as errors", () => {
    expect(
      isAuthFailureMessage(
        "Non siamo riusciti ad aprire l'accesso. Riprova tra poco.",
      ),
    ).toBe(true);
    expect(
      isAuthFailureMessage("Email di conferma inviata a ada@example.com."),
    ).toBe(false);
  });

  it("maps provider and identity errors without leaking raw copy", () => {
    expect(mapAuthProviderError("access_denied")).toMatch(/interrotto/i);
    expect(
      mapAuthProviderError("Unsupported provider: provider is not enabled"),
    ).toMatch(/non è ancora attivo/i);
    expect(mapAuthProviderError("User already registered")).toMatch(
      /già collegata/i,
    );
    expect(mapAuthProviderError("both auth code and code verifier")).toMatch(
      /questo browser/i,
    );
    expect(mapAuthProviderError("weird upstream dump")).not.toMatch(
      /weird upstream dump/i,
    );
  });
});
