/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GuideMarkdown } from "@/components/guides/guide-markdown";
import { MarkdownContent } from "@/components/editorial/markdown-content";
afterEach(cleanup);
for (const Component of [GuideMarkdown, MarkdownContent]) {
  it(`${Component.name}: names checklist items and lets keyboards reach tables`, () => {
    render(<Component content={'- [x] Passo completato\n- [ ] Passo successivo\n\n| Tool | Costo |\n| --- | --- |\n| Uno | Zero |'} />);
    expect(screen.getByRole('checkbox', { name: 'Passo completato' })).toHaveProperty('checked', true);
    expect(screen.getByRole('checkbox', { name: 'Passo successivo' })).toHaveProperty('checked', false);
    expect(screen.getByRole('table').getAttribute('tabindex')).toBe('0');
  });
}

it('keeps checklist names inside editorial callouts', () => {
  render(<GuideMarkdown content={':::decision Checklist\n- [ ] Controlla il risultato\n:::'} />);
  expect(screen.getByRole('checkbox', { name: 'Controlla il risultato' })).toBeTruthy();
});

it('keeps checklist names in sanitized HTML', () => {
  render(<GuideMarkdown content={'<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled>Conferma il passo</li></ul>'} />);
  expect(screen.getByRole('checkbox', { name: 'Conferma il passo' })).toBeTruthy();
});


it('keeps parent and nested checklist names separate', () => {
  render(<GuideMarkdown content={'- [ ] Principale\n  - [ ] Secondario'} />);
  expect(screen.getByRole('checkbox', { name: 'Principale' })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Secondario' })).toBeTruthy();
});
