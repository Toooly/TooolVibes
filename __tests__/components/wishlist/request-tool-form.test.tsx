// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequestToolForm } from "@/components/wishlist/request-tool-form";

vi.mock("@/components/security/submission-protection-fields", () => ({
  SubmissionProtectionFields: () => null,
}));

vi.mock("@/lib/config/sound", () => ({
  playTooolvibesSound: vi.fn(),
}));

afterEach(cleanup);

describe("RequestToolForm role switch", () => {
  it("switches between community and founder fields with the radio control", () => {
    render(<RequestToolForm />);

    expect(
      screen.getByRole("radiogroup", { name: "Tipo di segnalazione" }),
    ).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Consiglio un tool/i })).toBeTruthy();
    expect(screen.queryByLabelText(/Nome founder/i)).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: /Sono il founder/i }));

    expect(screen.getByLabelText(/Nome founder/i)).toBeTruthy();
    expect(screen.getByRole("group", { name: "Servizi richiesti" })).toBeTruthy();
  });
});
