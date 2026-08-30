import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "app/(marketing)/account/account.css"),
  "utf8",
);

describe("authenticated account shell", () => {
  it("does not hide the canonical product chrome", () => {
    expect(css).not.toMatch(/data-account-surface\] \.command-bar/);
    expect(css).not.toMatch(/data-account-surface\] \.mobile-top-bar/);
    expect(css).not.toMatch(/data-account-surface\] \.mobile-bottom-nav/);
  });
});
