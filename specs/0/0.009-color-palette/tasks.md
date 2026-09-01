# Tasks

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Record the feature directory in `.specify/feature.json`

## Phase 2: Foundational

- [x] T002 [US1] Define named CSS custom properties on `:root` in `src/client/styles.html`

## Phase 3: User Story 1 — one palette (P1)

- [x] T003 [US1] Point `:root` `color` and `background` at palette tokens in `src/client/styles.html`

## Phase 4: User Story 2 — same look (P1)

- [x] T004 [US2] Replace hardcoded hex and rgb colors in `src/client/styles.html` rules with `var(...)`

## Phase 5: User Story 3 — contract for later features (P2)

- [x] T005 [US3] Assert palette token names and that rules outside `:root` have no hex or `rgb(` colors in `tests/build.test.mjs`

## Phase 6: Polish

- [x] T006 Run `npm run build` and `npm test`
- [x] T007 Record the decision in `.config/ai/progress.ai`
