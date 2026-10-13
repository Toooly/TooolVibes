/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CollectionVariantPathsV4 } from "@/components/collections/collection-variant-paths-v4";
import type { CuratedCollection } from "@/lib/types/collection";
vi.mock("@/components/collections/collection-tool-glyph", () => ({ CollectionToolGlyph: () => null }));
afterEach(cleanup);
it("counts the actual tools in each variant instead of dividing by the baseline core count", () => {
  const collection = {
    slug: 'count-regression',
    included_tools: [{ is_core: true, tool: { slug: 'one', name: 'One' } }, { is_core: false, tool: { slug: 'two', name: 'Two' } }],
    stack_variants: [{ label: 'lean', core_tool_slugs: ['one'] }, { label: 'balanced', core_tool_slugs: ['one', 'two', 'missing'] }],
  } as unknown as CuratedCollection;
  render(<CollectionVariantPathsV4 collection={collection} />);
  fireEvent.click(screen.getByText('Varianti e percorsi'));
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map(tab => tab.querySelector('.cx-variant-paths-v4__tab-count')?.textContent)).toEqual(['1', '2']);
  fireEvent.click(tabs[1]);
  expect(screen.getByRole('tabpanel').querySelectorAll('.cx-variant-paths-v4__variant-tool')).toHaveLength(2);
});
