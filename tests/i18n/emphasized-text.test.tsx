// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmphasizedText } from "@/components/i18n/emphasized-text";

const translations: Record<string, string> = {
  "Il tuo lavoro, con più chiarezza.": "Bring clarity to your work.",
  "più chiarezza": "clarity",
  "In preparazione.": "Coming soon.",
  "preparazione": "preparation",
};
vi.mock("@/components/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (source: string) => translations[source] ?? source }),
}));
afterEach(cleanup);

describe("EmphasizedText", () => {
  it("preserves the translated sentence order while highlighting its translated phrase", () => {
    const { container } = render(<EmphasizedText text="Il tuo lavoro, con più chiarezza." emphasis="più chiarezza" />);
    expect(container.textContent).toBe("Bring clarity to your work.");
    expect(container.querySelector("strong")?.textContent).toBe("clarity");
  });
  it("keeps a complete natural sentence when the emphasis uses different wording", () => {
    const { container } = render(<EmphasizedText text="In preparazione." emphasis="preparazione" />);
    expect(container.textContent).toBe("Coming soon.");
    expect(container.querySelector("strong")).toBeNull();
  });
  it("preserves punctuation and authored text without emphasis", () => {
    const { container } = render(<EmphasizedText text="Una scelta, un motivo." />);
    expect(container.textContent).toBe("Una scelta, un motivo.");
  });
});
