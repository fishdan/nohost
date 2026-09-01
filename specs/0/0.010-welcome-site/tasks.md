# Tasks

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Record the feature directory in `.specify/feature.json`

## Phase 2: User Story 1 — header and nav (P1)

- [x] T002 [US1] Add a site header and navigation to `src/client/index.html` on every page
- [x] T003 [US1] Style the header and nav with existing palette tokens in `src/client/styles.html`

## Phase 3: User Story 2 — welcome home (P1)

- [x] T004 [US2] Replace home copy in `src/client/index.html` with Welcome to your own nohost and what-this-is content
- [x] T005 [US2] Set the home document title in `src/server/Code.ts`

## Phase 4: User Story 3 — make it yours with AI (P1)

- [x] T006 [US3] Add the README `start.ai` doctor prompt and GitHub project pointer on the home page in `src/client/index.html`

## Phase 5: Polish

- [x] T007 Update `PUBLIC_HOME_MARKERS` in `scripts/doctor.mjs` and the home-marker test in `tests/doctor.test.mjs`
- [x] T008 Assert header, welcome heading, and AI prompt in `tests/build.test.mjs`
- [x] T009 Run `npm run build` and `npm test`; record progress in `.config/ai/progress.ai`
