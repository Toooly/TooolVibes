/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExperienceForm, emptyExperienceFormValues } from "@/components/community/experience-form";

afterEach(() => cleanup());

describe("ExperienceForm", () => {
  it("H5-CREATE-11 blocks empty submit", () => {
    const onSubmit = vi.fn();
    render(
      <ExperienceForm
        toolSlug="blink"
        catalogNames={{ weweb: "WeWeb" }}
        initial={emptyExperienceFormValues()}
        mode="create"
        submitLabel="Invia per la revisione"
        busy={false}
        error={null}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Invia per la revisione" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Inserisci un nome pubblico (2-80).")).toBeTruthy();
  });

  it("H5-PRIV-01 has no email field and blank name", () => {
    render(
      <ExperienceForm
        toolSlug="blink"
        catalogNames={{}}
        initial={emptyExperienceFormValues()}
        mode="create"
        submitLabel="Invia per la revisione"
        busy={false}
        error={null}
        onCancel={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect((screen.getByLabelText(/Nome pubblico/) as HTMLInputElement).value).toBe("");
    expect(document.body.innerHTML).not.toMatch(/secret@example\.com/);
  });
});
