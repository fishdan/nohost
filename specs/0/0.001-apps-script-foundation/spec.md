# Apps Script nohost Web App Foundation

## Goal

Establish a small, maintainable Google Apps Script web app foundation that can be changed through GitHub and deployed through a reviewed CI/CD path.

## Acceptance criteria

- A TypeScript `doGet` entry point renders a responsive homepage with separate HTML partials for styling and client scripts.
- npm build and test commands produce and validate Apps Script-compatible output.
- clasp configuration is represented by a safe example, never by credentials or a real script ID.
- CI validates pull requests and deployment scaffolding targets only `main`.
- Google bootstrap and one-time manual steps are documented.
- Future maintainers are instructed to treat GitHub as the source of truth and protect production deployment.
