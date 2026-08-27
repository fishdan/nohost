# Apps Script Hello World Page

## Goal

Establish the first minimal public page for the Google Apps Script web app so the project can be built and verified before Google authorization and deployment setup.

## Scope

This task covers only the local source and build output for a static hello-world page. Google account authorization, Apps Script project connection, and deployment are separate follow-up work.

## Acceptance criteria

- The Apps Script `doGet` entry point renders a page with a clear “Hello, world!” message.
- The page remains responsive and uses the existing HTML partial architecture.
- The build output and automated test verify the hello-world content and required Apps Script files.
- No credentials or external Google service calls are added.
