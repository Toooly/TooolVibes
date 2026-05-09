# 00 - Project Overview

## Project names

This repository may be referred to as:

- **InfoToolvibes**
- **ControoTool**
- **ControoVibes**

Do not rename the project incorrectly. Do not use old/wrong names such as “Pro2Vibes”.

---

## Project nature

The project is an active web application / SaaS-style tools platform focused on presenting, organizing, and improving discovery of tools and resources through a premium UI.

The project has already been modified through several AI-assisted sessions, especially with Codex. OpenCode must not restart the project from scratch.

This is not a throwaway prototype. Treat it as a real production-oriented codebase.

---

## Main product goals

The platform should feel:

- premium
- modern
- trustworthy
- curated
- fast
- responsive
- polished
- commercially presentable

The user wants the site to be good enough to be shown, sold, or used seriously.

---

## Functional goals

The project may include or evolve toward:

- a homepage with strong visual hierarchy
- tool discovery sections
- tool cards
- curated lists
- categories
- filters
- wishlist-like functionality
- ProductHunt-style ranking or inspiration areas
- interactive carousels
- responsive navigation
- footer/contact sections
- premium marketing sections
- admin or SaaS-related views, depending on the current branch/state

Before changing functionality, inspect the current implementation.

---

## Current design direction

The design must not feel like a basic template.

Important expectations:

- better visual rhythm
- better spacing
- clearer hierarchy
- premium buttons
- useful animations
- refined hover and click states
- less static sections
- more engaging UI patterns
- no excessive darkness
- readable content
- mobile-first behavior where necessary
- desktop quality must remain high

---

## Main historical problems

Previous iterations had issues such as:

- mobile layout too large and uncomfortable
- fixed desktop widths
- overflowing text
- sections too long on mobile
- endless scrolling through repeated cards
- dark UI that felt too heavy
- static buttons
- basic hover effects
- carousel layouts that looked weak or broke on mobile
- duplicate CSS or stale files overriding newer work
- poor alignment in some sections
- inconsistent spacing
- blocks not resizing fluidly across screen sizes

---

## OpenCode onboarding rule

Before touching application code, OpenCode should:

1. Inspect the framework and project structure.
2. Find active routes/pages.
3. Find active UI components.
4. Identify the styling system.
5. Identify duplicated components or stale CSS.
6. Read all AI context files.
7. Only then plan changes.

Do not assume that file names alone reveal what is actually rendered. Verify imports and runtime usage.
