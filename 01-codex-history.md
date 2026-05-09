# 01 - Codex History

## Purpose

This file summarizes previous Codex work so OpenCode does not start from zero.

Codex has already been used heavily on this project. Some parts may be improved, some may be partially patched, and some may contain duplicate/stale code.

OpenCode must inspect carefully before making changes.

---

## Known previous Codex work

Codex has worked on:

- general UI/UX refactors
- homepage layout improvements
- visual redesign attempts
- premium-style section upgrades
- mobile responsiveness fixes
- button redesign with hover/click animations
- carousel redesign attempts
- tool card and section layout improvements
- attempts to reduce an overly dark UI
- attempts to make the site lighter and more readable
- attempts to improve mobile sections that were too large, too long, or not fluid
- attempts to remove duplicated/stale code where older patches override newer carousel/layout changes
- attempts to improve overall polish, colors, gradients, and decorative effects

---

## Problems Codex was asked to solve

Codex was previously asked to address problems such as:

- desktop looked acceptable in some parts, but mobile was poor
- blocks were too large on mobile
- containers used fixed desktop widths and did not adapt properly
- some sections became endless scrolling lists of cards
- some carousels were visually weak or broken
- arrows/buttons/carousel controls were not always usable
- some hover/click animations were too basic
- site was too dark in some versions
- buttons needed better visual identity
- text sometimes overflowed blocks
- layout alignment was inconsistent
- duplicate CSS/components may exist and override newer changes
- desktop carousel and mobile carousel behavior may require different layouts
- old patches may still exist and conflict with newer work

---

## Important Codex-related risk

Because previous AI sessions may have produced patches in multiple places, OpenCode must not blindly edit only one component.

Before fixing a visual issue, check:

- active route imports
- component import tree
- duplicated component names
- global CSS
- module CSS
- Tailwind classes
- old unused sections
- carousel implementations
- wrapper/container constraints
- breakpoints
- hardcoded widths/heights
- hidden overflow rules
- z-index and transparency issues

---

## UI areas likely touched by Codex

Possible areas previously modified:

- homepage hero
- tool listing sections
- carousel sections
- cards
- buttons
- navigation/header
- mobile layout
- footer
- decorative gradients
- background effects
- CTA blocks
- responsive containers
- global styles
- Tailwind or CSS tokens
- package dependencies for UI or animation

OpenCode must verify actual file names in the repo.

---

## What OpenCode should do before any UI refactor

1. Run `git status`.
2. Inspect current route/page files.
3. Identify which components are actually rendered.
4. Search for duplicated components.
5. Search for old CSS rules that override new ones.
6. Inspect responsive breakpoints.
7. Create a small plan.
8. Modify only necessary files.
9. Run verification commands.

---

## What OpenCode must avoid

- Do not reset the UI to a basic template.
- Do not remove working improvements from previous Codex sessions.
- Do not overwrite premium sections unless instructed.
- Do not make the site darker again unless explicitly requested.
- Do not make mobile a simple stacked version of desktop.
- Do not leave duplicate old carousel code active.
- Do not patch with random `!important` unless there is a strong reason and no cleaner alternative.
- Do not introduce fake data or fake links.
