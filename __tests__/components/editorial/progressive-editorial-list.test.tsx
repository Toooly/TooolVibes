// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProgressiveEditorialList } from "@/components/editorial/progressive-editorial-list";
import type { EditorialPostRecord } from "@/lib/types/article";

vi.mock("@/components/editorial/editorial-post-card", () => ({
  EditorialPostCard: ({ post }: { post: EditorialPostRecord }) => (
    <article>{post.title}</article>
  ),
}));

const posts = Array.from({ length: 8 }, (_, index): EditorialPostRecord => ({
  slug: `post-${index + 1}`,
  title: `Post ${index + 1}`,
  dek: `Dek ${index + 1}`,
  summary: `Summary ${index + 1}`,
  kind: "editorial",
  published_at: "2026-07-29",
  updated_at: "2026-07-29",
  source_label: "TooolVibes",
  source_url: "https://tooolvibes.eu",
  highlights: [],
  details: [],
  cautions: [],
}));

afterEach(() => {
  cleanup();
});

describe("ProgressiveEditorialList", () => {
  it("shows six entries initially and exposes one accessible expand/collapse toggle", () => {
    render(
      <ProgressiveEditorialList
        listId="editorial-test-list"
        posts={posts}
        sectionLabel="articoli"
      />,
    );

    expect(screen.getByText("Post 6")).toBeTruthy();
    expect(screen.queryByText("Post 7")).toBeNull();

    const toggle = screen.getByRole("button", {
      name: "Mostra tutto: articoli (+2)",
    });
    expect(toggle.getAttribute("aria-controls")).toBe("editorial-test-list");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);

    expect(screen.getByText("Post 8")).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toBe("Mostra meno: articoli");

    fireEvent.click(toggle);

    expect(screen.queryByText("Post 7")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
