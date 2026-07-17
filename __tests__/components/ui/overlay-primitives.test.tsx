// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // jsdom does not implement window.matchMedia, which Vaul and sonner call
  // at runtime. The polyfill is confined to this test file and never ships
  // in application code.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterEach(() => {
  cleanup();
  toast.dismiss();
  document.body.removeAttribute("style");
  document.documentElement.removeAttribute("style");
});

function portalHost() {
  return screen.getByTestId("overlay-portal-host");
}

function requireElement(element: Element | null, label: string) {
  if (!element) throw new Error(`Expected element: ${label}`);
  return element;
}

function NestedOverlayFixture() {
  return (
    <OverlayProvider>
      <Dialog>
        <DialogTrigger>Apri dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog principale</DialogTitle>
          <Drawer>
            <DrawerTrigger>Apri drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Drawer annidato</DrawerTitle>
              <DrawerClose>Chiudi drawer</DrawerClose>
              <button type="button">Azione drawer</button>
            </DrawerContent>
          </Drawer>
        </DialogContent>
      </Dialog>
    </OverlayProvider>
  );
}

describe("canonical overlay primitives", () => {
  it("uses the shared portal host and restores focus after Escape", async () => {
    render(
      <OverlayProvider>
        <Dialog>
          <DialogTrigger>Apri</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dettagli</DialogTitle>
            <button type="button">Conferma</button>
          </DialogContent>
        </Dialog>
      </OverlayProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Apri" });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Dettagli" });
    expect(dialog.closest("[data-tv-overlay-portal-host]")).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes only the topmost primitive when Base UI and Vaul are nested", async () => {
    render(<NestedOverlayFixture />);

    const dialogTrigger = screen.getByRole("button", { name: "Apri dialog" });
    fireEvent.click(dialogTrigger);
    await screen.findByRole("dialog", { name: "Dialog principale" });

    const drawerTrigger = screen.getByRole("button", { name: "Apri drawer" });
    fireEvent.click(drawerTrigger);
    const drawer = await screen.findByRole("dialog", {
      name: "Drawer annidato",
    });
    expect(drawer.closest("[data-tv-overlay-portal-host]")).toBe(portalHost());

    // NOTE: in jsdom a synthetic Escape dispatched on document reaches the
    // native keydown listeners of both frameworks at once, so selective
    // topmost dismissal is exercised through the drawer's own close
    // control; cross-framework Escape arbitration is covered by E2E tests.
    // Vaul also waits for a transitionend event before unmounting, which
    // jsdom never fires, so the deterministic signal here is focus
    // restoration to the drawer trigger.
    fireEvent.click(screen.getByRole("button", { name: "Chiudi drawer" }));
    await waitFor(() => {
      expect(document.activeElement).toBe(drawerTrigger);
    });
    // Vaul never finishes unmounting in jsdom, so its aria-hidden shim
    // keeps the still-open parent dialog out of role queries; assert the
    // dialog via its data slot instead.
    expect(
      document.querySelector("[data-slot='dialog-content']"),
    ).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(dialogTrigger);
  });
});

describe("overlay portal host contract", () => {
  it("renders defaultOpen content into the shared host on first render", async () => {
    render(
      <OverlayProvider>
        <Dialog defaultOpen>
          <DialogTrigger>Apri</DialogTrigger>
          <DialogContent>
            <DialogTitle>Apertura iniziale</DialogTitle>
          </DialogContent>
        </Dialog>
      </OverlayProvider>,
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog", { name: "Apertura iniziale" });
      expect(dialog.closest("[data-tv-overlay-portal-host]")).toBe(
        portalHost(),
      );
    });
  });

  it("falls back to document.body when no OverlayProvider is present", async () => {
    const { container } = render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Senza provider</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Senza provider",
    });
    expect(document.body.contains(dialog)).toBe(true);
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.closest("[data-tv-overlay-portal-host]")).toBeNull();
  });

  it("prefers an explicit container over the shared host", async () => {
    const customHost = document.createElement("div");
    customHost.setAttribute("data-tv-custom-host", "");
    document.body.appendChild(customHost);

    render(
      <OverlayProvider>
        <Dialog defaultOpen>
          <DialogPortal container={customHost}>
            <div data-testid="custom-portal-content">Contenuto custom</div>
          </DialogPortal>
        </Dialog>
      </OverlayProvider>,
    );

    const content = await screen.findByTestId("custom-portal-content");
    expect(content.closest("[data-tv-custom-host]")).toBe(customHost);
    expect(portalHost().contains(content)).toBe(false);

    customHost.remove();
  });

  it("removes portalled content and the host on unmount", async () => {
    const { unmount } = render(
      <OverlayProvider>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Da smontare</DialogTitle>
          </DialogContent>
        </Dialog>
      </OverlayProvider>,
    );

    await screen.findByRole("dialog", { name: "Da smontare" });
    expect(
      document.querySelector("[data-tv-overlay-portal-host]"),
    ).not.toBeNull();
    expect(
      document.querySelector("[data-slot='dialog-content']"),
    ).not.toBeNull();

    unmount();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    expect(document.querySelector("[data-tv-overlay-portal-host]")).toBeNull();
  });

  it("keeps Dialog and Sheet stacked in the shared host", async () => {
    render(
      <OverlayProvider>
        <Dialog>
          <DialogTrigger>Apri dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog esterno</DialogTitle>
            <Sheet>
              <SheetTrigger>Apri sheet</SheetTrigger>
              <SheetContent side="left">
                <SheetTitle>Sheet interna</SheetTitle>
              </SheetContent>
            </Sheet>
          </DialogContent>
        </Dialog>
      </OverlayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apri dialog" }));
    await screen.findByRole("dialog", { name: "Dialog esterno" });

    fireEvent.click(screen.getByRole("button", { name: "Apri sheet" }));
    const sheet = await screen.findByRole("dialog", { name: "Sheet interna" });

    expect(sheet.closest("[data-tv-overlay-portal-host]")).toBe(portalHost());
    // While the nested Sheet is open, Base UI marks the parent dialog popup
    // as inert, so it is no longer exposed to role queries; assert it via
    // its data slot instead.
    const outerPopup = requireElement(
      document.querySelector("[data-slot='dialog-content']"),
      "outer dialog content",
    );
    expect(outerPopup.closest("[data-tv-overlay-portal-host]")).toBe(
      portalHost(),
    );

    // Same jsdom limitation as the Drawer nesting test: the Sheet's own
    // close control is used for deterministic topmost dismissal.
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Sheet interna" })).toBeNull();
    });
    expect(
      screen.getByRole("dialog", { name: "Dialog esterno" }),
    ).not.toBeNull();
  });
});

describe("floating primitives on the shared host", () => {
  it("portals Popover content into the shared host", async () => {
    render(
      <OverlayProvider>
        <Popover>
          <PopoverTrigger>Apri popover</PopoverTrigger>
          <PopoverContent>
            <PopoverTitle>Titolo popover</PopoverTitle>
          </PopoverContent>
        </Popover>
      </OverlayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apri popover" }));
    const title = await screen.findByText("Titolo popover");
    const popup = requireElement(
      title.closest("[data-slot='popover-content']"),
      "popover content",
    );
    expect(portalHost().contains(popup)).toBe(true);
  });

  it("portals DropdownMenu content into the shared host", async () => {
    render(
      <OverlayProvider>
        <DropdownMenu>
          <DropdownMenuTrigger>Apri menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Voce uno</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </OverlayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apri menu" }));
    const menu = await screen.findByRole("menu");
    expect(screen.getByRole("menuitem", { name: "Voce uno" })).not.toBeNull();
    expect(portalHost().contains(menu)).toBe(true);
  });

  it("portals Select content into the shared host", async () => {
    render(
      <OverlayProvider>
        <Select>
          <SelectTrigger aria-label="Selettore di prova">
            <SelectValue placeholder="Scegli voce" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alpha">Alpha</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
          </SelectContent>
        </Select>
      </OverlayProvider>,
    );

    fireEvent.click(
      screen.getByRole("combobox", { name: "Selettore di prova" }),
    );
    const listbox = await screen.findByRole("listbox");
    expect(screen.getByRole("option", { name: "Alpha" })).not.toBeNull();
    expect(portalHost().contains(listbox)).toBe(true);
  });

  it("portals Tooltip content into the shared host", async () => {
    render(
      <OverlayProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Ancora tooltip</TooltipTrigger>
            <TooltipContent>Testo suggerimento</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </OverlayProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Ancora tooltip" });
    fireEvent.focus(trigger);
    const text = await screen.findByText("Testo suggerimento");
    const popup = requireElement(
      text.closest("[data-slot='tooltip-content']"),
      "tooltip content",
    );
    expect(portalHost().contains(popup)).toBe(true);
  });
});

describe("toast layer", () => {
  it("renders toasts on the semantic toast layer", async () => {
    render(<Toaster />);

    act(() => {
      toast.success("Salvataggio riuscito");
    });

    expect(await screen.findByText("Salvataggio riuscito")).toBeTruthy();
    const toaster = requireElement(
      document.querySelector("[data-sonner-toaster]"),
      "sonner toaster",
    );
    expect(toaster.className).toContain("z-[var(--tv-z-toast)]");
  });
});
