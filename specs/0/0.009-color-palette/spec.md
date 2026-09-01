# Color palette

**Feature Branch**: `0.009-color-palette`

**Created**: 2026-09-01

**Status**: Draft

## Goal

Give the public site one named color palette so a human maintainer or AI assistant can change the site’s colors in a single place, and so later pages keep the same look without copying hex values.

## User stories

1. As a maintainer, I can open one palette and see the named colors used by the site (page background, body text, accent, surfaces, borders).
2. As a visitor, the home, sign, and view pages still look the same after colors move onto that palette.
3. As a later feature author, I can reuse those named colors instead of inventing new hex values.

## Functional requirements

- **FR-001**: The site MUST host one canonical named color palette that covers the colors already used on public pages.
- **FR-002**: Page rules MUST use those named colors rather than repeating raw color values.
- **FR-003**: Moving colors onto the palette MUST preserve the current visual appearance (same hues, contrast, and surfaces).
- **FR-004**: The palette MUST live in the existing site-wide stylesheet, not a second stylesheet, a script, a spreadsheet, or a new include.
- **FR-005**: Automated tests MUST fail if the palette names disappear or if page rules go back to raw hex/rgb colors.

## Scope boundaries

- This feature names and centralizes the current colors. It does not restyle the site, add a dark theme, add a theme picker, or introduce a design-token build step.
- It does not change copy, layout, typography scale, or guestbook behavior.

## Acceptance criteria

- The stylesheet’s root palette defines named colors for text, muted text, accent, strong accent, page background, surface, on-accent, borders, input borders, and the card shadow.
- Component rules reference those names.
- Home, sign, and view pages keep the existing teal-on-light look.
- Build tests assert the palette names and that rules outside the palette do not contain hex or `rgb(` colors.

## Assumptions

- The current hex values in the stylesheet are the intended palette; no new colors are required.
- Apps Script continues to include one styles partial for every page.
