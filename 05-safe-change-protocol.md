# 05 - Safe Change Protocol

## Goal

This file defines how OpenCode should work safely inside this repository.

The project has previous Codex history and should not be modified blindly.

---

## Before making changes

1. Read the relevant context files.
2. Inspect the current implementation.
3. Check `git status`.
4. Identify the exact files that need changes.
5. Avoid touching unrelated files.
6. Verify which component/page is actually rendered.
7. Look for duplicated or stale code before editing.
8. Prepare a short plan.

---

## During changes

Rules:

- Make focused changes.
- Preserve existing working behavior.
- Avoid full rewrites unless required.
- Remove stale duplicate code only after confirming it is unused or harmful.
- Do not introduce fake content.
- Do not change unrelated pages.
- Do not silently remove features.
- Do not hide errors.
- Keep code readable.
- Keep responsive behavior central.
- Keep accessibility in mind.

---

## After changes

Run the available verification commands, depending on the project:

- `npm install` only if dependencies are missing or changed
- `npm run lint` if available
- `npm run typecheck` if available
- `npm run build` if available
- `npm run dev` for local visual inspection if needed

If a command is not available, say so.

If a command fails, report:

- command run
- failure reason
- whether it seems pre-existing or caused by current changes
- suggested next fix

---

## Required final response after changes

Always summarize:

1. What changed.
2. Files touched.
3. Why the change was needed.
4. How it was verified.
5. Any remaining risk.

---

## Forbidden behavior

Do not:

- rewrite the whole app without explicit request
- rename the project incorrectly
- use old/wrong project names
- remove working UI improvements
- break desktop while fixing mobile
- break mobile while improving desktop
- make the site darker again unless explicitly requested
- add placeholder/fake content
- add random dependencies
- leave duplicate code active
- use `!important` as a default solution
- edit unrelated sections
- assume deployment provider without checking repo config
- commit secrets
