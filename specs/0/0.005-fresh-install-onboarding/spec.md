# Fresh-install Hello World onboarding

## Goal

A less technical person, working with any AI coding assistant, can clone this repository and reach a public Hello World page by following README and `start.ai`, with `npm run doctor` as the gate.

## Scope

Documentation and first-run remediations only. No change to page content. Do not attach this repo to an unrelated existing Apps Script project.

## Acceptance criteria

- README leads with an AI prompt and a success check: `Public Hello World: visible`.
- First-run instructions install latest Node via nvm, enable the Apps Script API, log in to clasp, create a **new standalone** script (`--type standalone`, never `--type webapp`), push, and `npm run deploy`.
- `start.ai` tells the assistant to finish first-run through that success check before other feature work on a fresh clone.
- Doctor remediations match those commands and warn not to reuse a random existing script ID.
- GitHub production / Cloud bootstrap stay in a later README section, not the first-run path.
