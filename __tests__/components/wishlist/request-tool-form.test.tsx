// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequestToolForm } from "@/components/wishlist/request-tool-form";

vi.mock("@/components/security/submission-protection-fields", () => ({
  SubmissionProtectionFields: () => null,
}));

vi.mock("@/lib/config/sound", () => ({
  playTooolvibesSound: vi.fn(),
}));

afterEach(cleanup);

describe("RequestToolForm responsive flow steps", () => {
  it("renders one shared flow-step tree and updates it for the founder flow", () => {
    render(<RequestToolForm />);

    const communitySteps = screen.getByRole("list", {
      name: "Segnali richiesti",
    });
    expect(within(communitySteps).getAllByRole("listitem")).toHaveLength(4);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Sono il founder/,
      }),
    );

    const founderSteps = screen.getByRole("list", {
      name: "Opzioni business",
    });
    expect(within(founderSteps).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("list", { name: "Segnali richiesti" })).toBeNull();
  });
});
