# Plan

**Branch**: `0.010-welcome-site` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

## Summary

Add a sticky site header and navigation to `src/client/index.html`, replace the guestbook-only home copy with a welcome page, and restyle the chrome with existing CSS custom properties in `src/client/styles.html`. Update doctor home markers and build tests.

## Technical Context

**Language/Version**: Apps Script HtmlService templates, CSS custom properties

**Primary Dependencies**: existing `index.html`, `styles.html`, palette tokens from `0.009-color-palette`

**Testing**: `npm test` (build + doctor marker assertions)

**Target Platform**: Google Apps Script web app (`/exec`, iframe-safe `_top` links)

**Constraints**: no new hex/rgb in CSS rules; no deploy from this task; no second stylesheet

## Constitution Check

- Spec, plan, and tasks exist before implementation.
- Scope is the public chrome and home copy only.
- Palette and iframe-link conventions are preserved.
- Tests cover doctor home identity and page content.

## Steps

1. Wrap all pages in a `<header>` with brand + `<nav aria-label="Site">`.
2. Mark the current nav item with `aria-current="page"`.
3. Rewrite the home branch of `index.html` with welcome, what-it-is, and AI instructions.
4. Style header/nav and tighten main padding; keep guestbook cards as they are.
5. Set the home document title to **Welcome to your own nohost**.
6. Point `PUBLIC_HOME_MARKERS` at the welcome heading (plus guestbook nav labels).
7. Extend `tests/build.test.mjs` and `tests/doctor.test.mjs`.
