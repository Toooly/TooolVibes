// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { LanguagePicker } from "@/components/i18n/language-picker";
import { LocalizedAttributes, LocalizedText } from "@/components/i18n/localized-text";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n/locale";

function Fixture() {
  return <LocaleProvider><LanguagePicker /><h1><LocalizedText>Catalogo</LocalizedText></h1><LocalizedAttributes><input placeholder="Cerca tool" aria-label="Cerca tool" /></LocalizedAttributes><p><LocalizedText>Una nota personale</LocalizedText></p></LocaleProvider>;
}

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "languages", { configurable: true, value: ["en-US"] });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Catalogo: "Catalog", "Cerca tool": "Search tools" }) }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("site language controls", () => {
  it("detects English, translates attributes, persists Italian and restores auto", async () => {
    render(<Fixture />);
    await screen.findByRole("heading", { name: "Catalog" });
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByPlaceholderText("Search tools")).toBeTruthy();
    expect(screen.getByText("Una nota personale")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "it" } });
    await screen.findByRole("heading", { name: "Catalogo" });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
    cleanup(); render(<Fixture />);
    await waitFor(() => expect(document.documentElement.lang).toBe("it"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "auto" } });
    await screen.findByRole("heading", { name: "Catalog" });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("auto");
  });
  it("remains usable when browser storage throws and cancels stale English switches", async () => {
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["it-IT"] });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked storage"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked storage"); });
    render(<Fixture />);
    await screen.findByRole("heading", { name: "Catalogo" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "en" } });
    await screen.findByRole("heading", { name: "Catalog" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "en" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "it" } });
    await waitFor(() => expect(document.documentElement.lang).toBe("it"));
    expect(screen.getByRole("heading", { name: "Catalogo" })).toBeTruthy();
  });
});

it("forwards injected trigger handlers, styles and refs to the original element", () => {
  const events: string[] = [];
  const ref = { current: null as HTMLButtonElement | null };
  render(<LocalizedAttributes className="injected" aria-expanded="true" onClick={() => events.push("parent")} ref={ref}><button className="original" title="Cerca tool" onClick={() => events.push("child")}>Open</button></LocalizedAttributes>);
  const button = screen.getByRole("button", { name: "Open" });
  expect(button.className).toBe("original injected");
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(ref.current).toBe(button);
  fireEvent.click(button);
  expect(events).toEqual(["child", "parent"]);
});
