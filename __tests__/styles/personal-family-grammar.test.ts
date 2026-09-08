import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Visual Grammar V3 — PHASE 5 PERSONAL FAMILY.
 * Law: UI = Manrope (Anton exceptional only), DATA = mono,
 * YELLOW = primary action, PURPLE = selected/remembered, LILAC = personal
 * structure. No editorial gold, no radar cyan as Personal decoration.
 */

const tokensCss = readFileSync(resolve(process.cwd(), "styles/tokens.css"), "utf8");
const shortlistCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/shortlist/shortlist.css"),
  "utf8",
);
const compareCss = readFileSync(resolve(process.cwd(), "styles/compare.css"), "utf8");
const decisionSheetCss = readFileSync(
  resolve(process.cwd(), "components/account/workspace/decision-sheet.css"),
  "utf8",
);
const accountCss = readFileSync(
  resolve(process.cwd(), "app/(marketing)/account/account.css"),
  "utf8",
);
const globalAccountCss = readFileSync(
  resolve(process.cwd(), "styles/account.css"),
  "utf8",
);
const memberExperienceCss = readFileSync(
  resolve(process.cwd(), "styles/member-experience.css"),
  "utf8",
);

function extractBlock(source: string, selector: string): string | null {
  const selectorIndex = source.indexOf(selector);
  if (selectorIndex === -1) return null;
  const openIndex = source.indexOf("{", selectorIndex);
  if (openIndex === -1) return null;
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  return null;
}

describe("V3 personal tokens", () => {
  it("espone la famiglia personal graphite + muted lilac completa", () => {
    expect(tokensCss).toContain(
      "--tv-grammar-personal-surface: var(--tv-color-surface-raised)",
    );
    expect(tokensCss).toContain(
      "--tv-grammar-personal-surface-raised: var(--tv-color-surface-elevated)",
    );
    expect(tokensCss).toContain("--tv-grammar-personal-ink: var(--tv-ink-primary)");
    expect(tokensCss).toContain(
      "--tv-grammar-personal-ink-secondary: var(--tv-ink-secondary)",
    );
    expect(tokensCss).toContain(
      "--tv-grammar-personal-ink-muted: var(--tv-ink-muted-aa)",
    );
    expect(tokensCss).toContain(
      "--tv-grammar-personal-accent: color-mix(in srgb, var(--tv-color-violet-300) 62%, var(--tv-color-ink-400))",
    );
    expect(tokensCss).toContain(
      "--tv-grammar-personal-accent-strong: var(--tv-color-violet-300)",
    );
    expect(tokensCss).toContain("--tv-grammar-personal-border:");
    expect(tokensCss).toContain("--tv-grammar-personal-wash:");
  });

  it("dichiara il motif remembered: bordo lilac quieto, mai un fill", () => {
    expect(tokensCss).toContain("--tv-grammar-personal-remembered-edge:");
    expect(tokensCss).toContain(
      "--tv-grammar-personal-remembered-marker: var(--tv-color-violet-300)",
    );
  });
});

describe("V3 shortlist — personal shelf", () => {
  it("l'azione primaria empty e Apri il confronto sono activation yellow", () => {
    const cta = extractBlock(shortlistCss, ".mobile-library-empty__cta {");
    expect(cta).toContain("var(--tv-button-activation-bg)");
    expect(cta).toContain("var(--tv-button-activation-text)");
    const openChip = extractBlock(
      shortlistCss,
      ".mobile-library-board__compare-chip--open {",
    );
    expect(openChip).toContain("var(--tv-button-activation-bg)");
    expect(openChip).toContain("var(--tv-button-activation-text)");
  });

  it("i chip candidato sono quieti: niente fill brand, il colore è solo il dot", () => {
    const chip = extractBlock(shortlistCss, ".mobile-library-board__compare-chip {");
    expect(chip).toContain("var(--tv-grammar-personal-surface-raised)");
    expect(chip).not.toContain("var(--tv-accent-primary) !important");
  });

  it("stato salvato/ricordato è lilac, non yellow", () => {
    const activeChip = extractBlock(
      shortlistCss,
      '.shortlist-sheet-chip[aria-pressed="true"] {',
    );
    expect(activeChip).toContain("var(--tv-grammar-personal-wash)");
    expect(activeChip).toContain("var(--tv-grammar-personal-accent-strong)");
    const decided = extractBlock(
      shortlistCss,
      '.shortlist-decision-chip[data-outcome="selected"] {',
    );
    expect(decided).toContain("var(--tv-grammar-personal-remembered-edge)");
  });

  it("H1 e titoli usano UI (Manrope), non display Anton", () => {
    const h1 = extractBlock(shortlistCss, ".mobile-library-board__header h1 {");
    expect(h1).toContain("var(--tv-font-ui)");
    expect(h1).not.toContain("var(--tv-font-display)");
    const emptyH1 = extractBlock(shortlistCss, ".mobile-library-empty__content h1 {");
    expect(emptyH1).toContain("var(--tv-font-ui)");
  });

  it("il cyan del radar non è decorazione personal", () => {
    expect(shortlistCss).not.toContain("var(--tv-accent-cyan)");
  });

  it("l'asse mobile è il gutter canonico con reserva bottom-nav", () => {
    expect(shortlistCss).toContain("var(--tv-gutter-mobile)");
    expect(shortlistCss).toContain("calc(var(--tv-bottom-nav-total) + 2.75rem)");
  });

  it("kill reduced-motion per chip e microtransizioni", () => {
    expect(shortlistCss).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

describe("V3 compare — la transizione verso la decisione", () => {
  it("i CTA primari (onboarding, battle, workbench, panel) sono activation yellow", () => {
    for (const selector of [
      ".compare-onboarding__cta {",
      ".tool-battle-page__cta--primary {",
      ".compare-workbench-chrome__cta--primary {",
      ".compare-decision-panel__decide {",
    ]) {
      const block = extractBlock(compareCss, selector);
      expect(block, selector).toContain("var(--tv-button-activation-bg)");
      expect(block, selector).not.toContain("var(--tv-accent-primary)");
    }
  });

  it("Decidi (identità + jump) è l'azione primaria quando il confronto è pronto", () => {
    // La base condivisa arriva prima; la legge CTA vive nel blocco di override.
    const overrideStart = compareCss.indexOf("with 2+ candidates");
    expect(overrideStart).toBeGreaterThan(-1);
    const decide = extractBlock(
      compareCss.slice(overrideStart),
      ".compare-workbench-identity__decide,",
    );
    expect(decide).toContain("var(--tv-button-activation-bg)");
    expect(decide).toContain("var(--tv-button-activation-text)");
  });

  it("selected (obiettivo, trend, opzione decisione) è purple, non yellow", () => {
    const objective = extractBlock(
      compareCss,
      '.compare-objective__chip[data-active="true"] .compare-objective__chip-label {',
    );
    expect(objective).toContain("var(--tv-accent-brand)");
    const option = extractBlock(
      compareCss,
      ".compare-decision-panel__option:has(input:checked) {",
    );
    expect(option).toContain("var(--tv-grammar-selected)");
    expect(option).toContain("var(--tv-grammar-selected-wash)");
  });

  it("H1 intro è UI, non display; gli step usano lilac non cyan", () => {
    const h1 = extractBlock(compareCss, ".tool-battle-page__intro h1 {");
    expect(h1).toContain("var(--tv-font-ui)");
    expect(h1).not.toContain("var(--tv-font-display)");
    const steps = extractBlock(compareCss, ".tool-battle-page__steps span {");
    expect(steps).toContain("var(--tv-grammar-personal-accent-strong)");
    expect(steps).not.toContain("var(--tv-accent-cyan)");
    expect(compareCss).not.toContain("var(--tv-accent-cyan)");
  });

  it("il vincitore non vive solo di colore: marker vantaggio + peso", () => {
    expect(compareCss).toContain(".compare-factor-matrix__factor-advantage");
    const winnerCell = extractBlock(compareCss, ".compare-factor-matrix__cell.is-winner {");
    expect(winnerCell).toContain("font-weight: var(--tv-weight-bold)");
    expect(winnerCell).toContain("inset 2px 0 0 var(--tv-grammar-selected)");
  });
});

describe("V3 decision sheet — selection → decision", () => {
  it("confermare la decisione è l'azione primaria: activation yellow", () => {
    const confirm = extractBlock(decisionSheetCss, ".tv-decision-sheet__confirm {");
    expect(confirm).toContain("var(--tv-button-activation-bg)");
    expect(confirm).toContain("var(--tv-button-activation-text)");
    expect(confirm).not.toContain("var(--tv-accent-brand)");
  });

  it("outcome e reason selezionati restano purple wash (stato)", () => {
    const outcome = extractBlock(decisionSheetCss, '.tv-decision-sheet__outcome[data-active="true"] {');
    expect(outcome).toContain("var(--tv-accent-brand)");
  });
});

describe("V3 account — il mio spazio", () => {
  it("H1 pagina e titoli stack/journal usano UI, non Anton", () => {
    const title = extractBlock(accountCss, ".tv-app__page-title {");
    expect(title).toContain("var(--tv-font-ui)");
    expect(title).not.toContain("var(--tv-font-display)");
    const stackTitle = extractBlock(accountCss, ".tv-stacks-empty__title,");
    expect(stackTitle).toContain("var(--tv-font-ui)");
    expect(stackTitle).not.toContain("var(--tv-font-display)");
  });

  it("il CTA primario dello spazio è yellow, non violet glass", () => {
    const primary = extractBlock(accountCss, ".tv-home-cta--primary {");
    expect(primary).toContain("var(--tv-button-activation-bg)");
    expect(primary).toContain("var(--tv-button-activation-text)");
    expect(primary).not.toContain("rgba(154, 109, 255");
    const appPrimary = extractBlock(globalAccountCss, ".account-btn-primary {");
    expect(appPrimary).toContain("var(--tv-button-activation-bg)");
    expect(appPrimary).not.toContain("#8b6cff");
  });

  it("la nav interior selezionata è purple grammar + peso, non yellow", () => {
    const current = extractBlock(accountCss, '.tv-space-switch a[aria-current="page"] {');
    expect(current).toContain("var(--tv-grammar-selected)");
    expect(current).toContain("var(--tv-grammar-selected-wash)");
    expect(current).toContain("font-weight: var(--tv-weight-bold)");
  });

  it("l'asse canvas mobile è il gutter canonico 20px", () => {
    const canvas = extractBlock(accountCss, ".tv-app__canvas {");
    expect(canvas).toContain("var(--tv-gutter-mobile)");
  });

  it("auth resta superficie Activation: primary yellow e tab selected purple", () => {
    const authPrimary = extractBlock(accountCss, ".v-auth-btn-primary,");
    expect(authPrimary).toContain("var(--tv-button-activation-bg)");
    const tab = extractBlock(accountCss, ".v-auth-tab.is-active {");
    expect(tab).toContain("var(--tv-accent-primary)");
  });

  it("le decisioni sono un timeline lilac: rail + marker ricordato", () => {
    const rail = extractBlock(
      accountCss,
      '[data-workspace-view="decisioni"] .tv-home-stack {',
    );
    expect(rail).toContain("var(--tv-grammar-personal-remembered-edge)");
    expect(rail).toContain("border-left: 2px solid");
    const marker = extractBlock(
      accountCss,
      '[data-workspace-view="decisioni"] .tv-mod[data-decision-card]::before {',
    );
    expect(marker).toContain("var(--tv-grammar-personal-remembered-marker)");
  });

  it("il dock route-guide usa il gutter canonico, non 1rem hardcoded", () => {
    expect(memberExperienceCss).toContain("padding: 0 var(--tv-gutter-mobile) calc(");
  });
});
