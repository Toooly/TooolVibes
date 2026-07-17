// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FigmaDesignSystemShowcase } from "@/components/dev/figma-design-system-showcase";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
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
});

afterEach(() => {
  cleanup();
});

function isDisabled(element: HTMLElement) {
  return (element as HTMLButtonElement).disabled === true;
}

/**
 * axe runs on rendered fragments, not on full pages: the `region` landmark
 * rule only applies to whole documents, and jsdom cannot compute real color
 * contrast (the release contrast contract is enforced statically on tokens
 * and documented in docs/design-system/cascade-and-token-foundation.md).
 */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

/**
 * jsdom does not implement activation behavior for synthetic key events, so
 * keyboard support is asserted through the part of the contract that makes
 * Enter/Space work in real browsers: a native, focusable <button> in the
 * default tab order. Real key dispatch is covered by the E2E layer.
 */
function expectNativeKeyboardContract(element: HTMLElement) {
  expect(element.tagName).toBe("BUTTON");
  // Natural tab order: no tabindex, or the explicit Base UI tabindex="0".
  expect([null, "0"]).toContain(element.getAttribute("tabindex"));
  (element as HTMLButtonElement).focus();
  expect(document.activeElement).toBe(element);
}

describe("Button canonical contract", () => {
  it("renders a native button with the canonical data contract", () => {
    render(<Button>Azione</Button>);

    const button = screen.getByRole("button", { name: "Azione" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("data-slot")).toBe("button");
    expect(button.getAttribute("data-size")).toBe("default");
    expect(button.className).toContain("premium-button");
    expect(button.className).toContain("premium-button-primary");
  });

  it("applies the canonical variants", () => {
    render(
      <>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Danger</Button>
        <Button variant="premium">Premium</Button>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Secondary" }).className,
    ).toContain("premium-button-secondary");
    expect(screen.getByRole("button", { name: "Outline" }).className).toContain(
      "premium-button-outline",
    );
    expect(screen.getByRole("button", { name: "Ghost" }).className).toContain(
      "premium-button-ghost",
    );
    expect(screen.getByRole("button", { name: "Danger" }).className).toContain(
      "premium-button-danger",
    );
    expect(
      screen.getByRole("button", { name: "Premium" }).className,
    ).toContain("premium-button-premium");
  });

  it("exposes every canonical size through data-size", () => {
    const sizes = ["xs", "sm", "default", "md", "lg", "xl", "icon"] as const;
    render(
      <>
        {sizes.map((size) => (
          <Button key={size} size={size} aria-label={`Size ${size}`}>
            {size === "icon" ? "+" : `Size ${size}`}
          </Button>
        ))}
      </>,
    );

    for (const size of sizes) {
      expect(
        screen
          .getByRole("button", { name: `Size ${size}` })
          .getAttribute("data-size"),
      ).toBe(size);
    }
  });

  it("blocks pointer and keyboard activation when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabilitato
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Disabilitato" });
    expect(isDisabled(button)).toBe(true);
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Enter" });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("exposes the loading state with aria-busy and suppresses activation", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvataggio
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Salvataggio" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("data-loading")).toBe(true);
    expect(isDisabled(button)).toBe(true);
    expect(button.querySelector("svg.animate-spin")).not.toBeNull();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the native keyboard activation contract", () => {
    render(<Button>Tastiera</Button>);
    expectNativeKeyboardContract(
      screen.getByRole("button", { name: "Tastiera" }),
    );
  });

  it("has no axe violations across variants and states", async () => {
    const { container } = render(
      <div>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Danger</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button size="icon-sm" aria-label="Icona">
          +
        </Button>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe("Badge canonical contract", () => {
  it("renders the canonical data contract and variants", () => {
    render(
      <>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </>,
    );

    const neutral = screen.getByText("Neutral");
    expect(neutral.tagName).toBe("SPAN");
    expect(neutral.getAttribute("data-slot")).toBe("badge");
    expect(neutral.getAttribute("data-variant")).toBe("neutral");

    for (const variant of ["accent", "success", "warning", "danger", "info"]) {
      const badge = screen.getByText(variant[0].toUpperCase() + variant.slice(1));
      expect(badge.getAttribute("data-variant")).toBe(variant);
    }
  });

  it("has no axe violations across variants", async () => {
    const { container } = render(
      <div>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="trust">Trust</Badge>
        <Badge variant="verified">Verified</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe("Card canonical contract", () => {
  it("renders every canonical slot", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Titolo</CardTitle>
          <CardDescription>Descrizione</CardDescription>
          <CardAction>
            <button type="button">Azione</button>
          </CardAction>
        </CardHeader>
        <CardContent>Contenuto</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    for (const slot of [
      "card",
      "card-header",
      "card-title",
      "card-description",
      "card-action",
      "card-content",
      "card-footer",
    ]) {
      expect(container.querySelector(`[data-slot='${slot}']`)).not.toBeNull();
    }
  });

  it("exposes the density size through data-size", () => {
    const { container } = render(<Card size="sm">Compatta</Card>);
    expect(
      container.querySelector("[data-slot='card']")?.getAttribute("data-size"),
    ).toBe("sm");
  });

  it("has no axe violations in the composed card", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Titolo</CardTitle>
          <CardDescription>Descrizione accessibile</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenuto della card.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Conferma</Button>
        </CardFooter>
      </Card>,
    );

    await expectNoAxeViolations(container);
  });
});

describe("Chip canonical contract", () => {
  it("renders a native toggle button with the canonical data contract", () => {
    render(<Chip>Filtro</Chip>);

    const chip = screen.getByRole("button", { name: "Filtro" });
    expect(chip.tagName).toBe("BUTTON");
    expect(chip.getAttribute("data-slot")).toBe("chip");
    expect(chip.getAttribute("data-variant")).toBe("default");
    expect(chip.getAttribute("data-size")).toBe("default");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles selection on click and notifies the change", () => {
    const onSelectedChange = vi.fn();
    render(<Chip onSelectedChange={onSelectedChange}>AI coding</Chip>);

    const chip = screen.getByRole("button", { name: "AI coding" });
    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.hasAttribute("data-pressed")).toBe(true);
    expect(onSelectedChange).toHaveBeenCalledWith(true);

    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(onSelectedChange).toHaveBeenCalledWith(false);
  });

  it("supports the controlled selected state", () => {
    const onSelectedChange = vi.fn();
    render(
      <Chip selected onSelectedChange={onSelectedChange}>
        Controllata
      </Chip>,
    );

    const chip = screen.getByRole("button", { name: "Controllata" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(chip);
    expect(onSelectedChange).toHaveBeenCalledWith(false);
    // Controlled: the rendered state only changes when the prop changes.
    expect(chip.getAttribute("aria-pressed")).toBe("true");
  });

  it("honors defaultSelected for the uncontrolled flow", () => {
    render(<Chip defaultSelected>Preselezionata</Chip>);

    const chip = screen.getByRole("button", { name: "Preselezionata" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.hasAttribute("data-pressed")).toBe(true);
  });

  it("blocks activation when disabled", () => {
    const onSelectedChange = vi.fn();
    render(
      <Chip disabled onSelectedChange={onSelectedChange}>
        Disabilitata
      </Chip>,
    );

    const chip = screen.getByRole("button", { name: "Disabilitata" });
    expect(isDisabled(chip)).toBe(true);
    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("keeps the native keyboard activation contract", () => {
    render(<Chip>Tastiera</Chip>);
    expectNativeKeyboardContract(
      screen.getByRole("button", { name: "Tastiera" }),
    );
  });

  it("exposes canonical variants and sizes", () => {
    render(
      <>
        <Chip variant="accent">Accent</Chip>
        <Chip variant="outline">Outline</Chip>
        <Chip size="sm">Small</Chip>
        <Chip size="lg">Large</Chip>
      </>,
    );

    expect(
      screen.getByRole("button", { name: "Accent" }).getAttribute("data-variant"),
    ).toBe("accent");
    expect(
      screen.getByRole("button", { name: "Outline" }).getAttribute("data-variant"),
    ).toBe("outline");
    expect(
      screen.getByRole("button", { name: "Small" }).getAttribute("data-size"),
    ).toBe("sm");
    expect(
      screen.getByRole("button", { name: "Large" }).getAttribute("data-size"),
    ).toBe("lg");
  });

  it("has no axe violations across variants and states", async () => {
    const { container } = render(
      <div>
        <Chip>Default</Chip>
        <Chip defaultSelected>Selected</Chip>
        <Chip variant="accent">Accent</Chip>
        <Chip variant="accent" defaultSelected>
          Accent selected
        </Chip>
        <Chip variant="outline">Outline</Chip>
        <Chip disabled>Disabled</Chip>
        <Chip defaultSelected disabled>
          Selected disabled
        </Chip>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});

describe("design system showcase state matrix", () => {
  it("renders the primitive state matrix with the new Chip primitive", () => {
    render(<FigmaDesignSystemShowcase />);

    expect(screen.getByText("Matrix stati primitive")).toBeTruthy();
    expect(screen.getAllByText("Chip").length).toBeGreaterThan(0);
    // Every static state cell of the matrix is present.
    for (const label of ["Default", "Selected", "Disabled", "Loading"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // Chips render as toggle buttons with the pressed contract.
    const pressedChips = document.querySelectorAll(
      "[data-slot='chip'][aria-pressed='true']",
    );
    expect(pressedChips.length).toBeGreaterThan(0);
  });

  it("has no axe violations on the full showcase", async () => {
    const { container } = render(<FigmaDesignSystemShowcase />);
    await expectNoAxeViolations(container);
  });
});
