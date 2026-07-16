import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GateModal } from "@/components/coming-soon/gate-modal";
import { WaitlistForm } from "@/components/coming-soon/waitlist-form";

describe("coming soon SSR contract", () => {
  it("renders deterministic waitlist markup with an explicit label", () => {
    const firstRender = renderToString(<WaitlistForm />);
    const secondRender = renderToString(<WaitlistForm />);

    expect(firstRender).toBe(secondRender);
    expect(firstRender).toContain('for="waitlist-email"');
    expect(firstRender).toContain('id="waitlist-email"');
    expect(firstRender).toContain('name="email"');
  });

  it("renders deterministic dialog markup with explicit relationships", () => {
    const props = {
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    };
    const firstRender = renderToString(<GateModal {...props} />);
    const secondRender = renderToString(<GateModal {...props} />);

    expect(firstRender).toBe(secondRender);
    expect(firstRender).toContain('role="dialog"');
    expect(firstRender).toContain('aria-modal="true"');
    expect(firstRender).toContain('aria-labelledby="gate-modal-title"');
    expect(firstRender).toContain('for="gate-password"');
    expect(firstRender).toContain('id="gate-password"');
  });
});
