# Welcome site chrome

**Feature Branch**: `0.010-welcome-site`

**Created**: 2026-09-01

**Status**: Draft

## Goal

Make the public app look like a small website: a persistent header with navigation, and a home page that welcomes people to **their own nohost**, explains what the site is, and tells them how to make a copy with an AI assistant.

## User stories

1. As a visitor, I see a header with the site name and links to Home, Sign the guestbook, and See the guestbook on every page.
2. As a visitor, the home page says **Welcome to your own nohost**, explains that this is a public Google Apps Script website that a non-programmer can run, and points me to the guestbook.
3. As someone who wants their own site, the home page tells me to open this project in an AI coding assistant and use the `start.ai` doctor prompt from the README.

## Functional requirements

- **FR-001**: Every public page MUST show a site header with the nohost name (linking home) and a navigation bar.
- **FR-002**: Navigation MUST include Home, Sign the guestbook, and See the guestbook, using the existing public `/exec` routes and `_top` links so they work in the Apps Script iframe.
- **FR-003**: The current page MUST be identifiable in the navigation (for example `aria-current="page"`).
- **FR-004**: The home page MUST use the heading **Welcome to your own nohost**.
- **FR-005**: The home page MUST explain, in plain language, that nohost is a small public website hosted as a Google Apps Script web app, that a Gmail account is enough to have one, and that you do not need to be a programmer.
- **FR-006**: The home page MUST include the intended AI onboarding prompt: read `start.ai` and keep going until `npm run doctor` prints **Public site: visible**, asking the human to click anything that needs a browser.
- **FR-007**: Guestbook sign and view pages MUST keep their existing forms and lists; only shared chrome and home copy change.
- **FR-008**: Colors MUST come from the existing `:root` palette. Do not introduce new hex or `rgb(` values in rules.

## Scope boundaries

- No new routes, accounts, or pages beyond home, sign, and view.
- No footer, logo image, dark theme, or marketing landing-page framework.
- Do not change guestbook validation, Sheets, or deployment.

## Acceptance criteria

- Home, sign, and view share one header/nav.
- Home copy matches the welcome / what-it-is / make-it-yours-with-AI intent above.
- Doctor home checks still prove the anonymous home page is the current site (markers include the welcome heading).
- Build tests cover the header, welcome heading, AI prompt, and guestbook pages.
- Visual look stays teal-on-light using palette tokens.

## Assumptions

- Nav labels stay **Sign the guestbook** and **See the guestbook** so they remain clear and match existing routes.
- The GitHub repository may be linked as the project to open in an AI assistant.
