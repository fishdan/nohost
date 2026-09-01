# Plan

**Branch**: `0.009-color-palette` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

## Summary

Define CSS custom properties on `:root` in `src/client/styles.html` (the existing HtmlService styles partial) and replace hardcoded hex/rgb colors in rules with `var(...)`. Keep the same values so the live look does not change.

## Technical Context

**Language/Version**: CSS custom properties in the Apps Script HTML styles partial

**Primary Dependencies**: existing `src/client/styles.html` include via `<?!= include('styles'); ?>`

**Storage**: N/A

**Testing**: Node test runner (`npm test`) asserting built `dist/styles.html`

**Target Platform**: Google Apps Script HtmlService web app

**Project Type**: web application stylesheet

**Constraints**: no second HTML include; no visual redesign; no new npm dependencies

**Scale/Scope**: one stylesheet, current guestbook/home pages only

## Constitution Check

- Spec, plan, and tasks exist before implementation.
- Change is narrowly scoped to the existing stylesheet.
- Tests cover the palette contract.
- Visual conventions are preserved.

## Palette tokens

| Token | Value | Used for |
| --- | --- | --- |
| `--color-text` | `#17324d` | body text |
| `--color-text-muted` | `#537080` | secondary list text |
| `--color-accent` | `#176579` | links and buttons |
| `--color-accent-strong` | `#277c8e` | eyebrow |
| `--color-page` | `#f4f7f9` | page background |
| `--color-surface` | `#fff` | cards |
| `--color-on-accent` | `#fff` | button text |
| `--color-border` | `#d5e1e7` | card and list borders |
| `--color-border-input` | `#9aafb9` | form fields |
| `--shadow-card` | `0 0.75rem 2rem rgb(23 50 77 / 8%)` | card shadow |

## Steps

1. Expand `:root` in `src/client/styles.html` with the tokens above and point `color` / `background` at them.
2. Replace remaining hex and rgb colors in rules with `var(...)`.
3. Assert the palette and the no-raw-color-in-rules contract in `tests/build.test.mjs`.
4. Run `npm run build` and `npm test`.
