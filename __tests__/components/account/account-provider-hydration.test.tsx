import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/browser-client", () => ({
  getBrowserSupabaseClient: vi.fn(),
  isSupabaseBrowserEnabled: () => {
    throw new Error("browser auth config must not be read during render");
  },
  loadBrowserSupabaseRuntimeConfig: vi.fn(),
}));

import {
  AccountProvider,
  useAccount,
} from "@/components/account/account-provider";

function AccountHydrationProbe() {
  const account = useAccount();
  return (
    <span>
      {account.authEnabled ? "enabled" : "disabled"}:{account.status}
    </span>
  );
}

describe("AccountProvider hydration contract", () => {
  it("uses the server-serialized auth capability for the first render", () => {
    expect(
      renderToStaticMarkup(
        <AccountProvider initialAuthEnabled>
          <AccountHydrationProbe />
        </AccountProvider>,
      ),
    ).toContain("enabled:loading");

    expect(
      renderToStaticMarkup(
        <AccountProvider>
          <AccountHydrationProbe />
        </AccountProvider>,
      ),
    ).toContain("disabled:loading");
  });
});
