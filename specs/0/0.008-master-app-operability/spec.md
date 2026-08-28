# Master app operability

## Goal

Treat the Apps Script project created at Hello World first-run as the one nohost website. Every later feature, including the guestbook, is published into that same project. A human and an AI assistant can operate the live site from this repository: find the public URL, prove the current pages work, and deploy through GitHub production.

## Scope

Doctor public checks, first-run and identity documentation, guestbook authorization remediation, and GitHub production pointed at this checkout’s master script. No guestbook UX rewrite. Do not create a second nohost Apps Script project. Do not attach a random existing script.

## Acceptance criteria

- First-run creates one standalone master app. After `.clasp.json` exists, feature work only pushes and redeploys that script.
- `npm run doctor` (not `--ci`) resolves and prints the versioned `/exec` URL, then anonymously checks the current home page, `?page=sign`, and `?page=view`.
- Doctor success is **Public site: visible**, based on current page markers, not a permanent `Hello, world!` fingerprint.
- If Sheets is not authorized, doctor FAIL tells the owner to open the printed `?page=view` URL while signed in and approve access. It does not tell them to run a function in the Apps Script editor.
- Script IDs and credentials stay out of git. The public `/exec` URL may be printed by doctor and shown in README once stable.
- GitHub `production` deploys this checkout’s master script and the same versioned deployment ID.
- Automated tests cover anonymous page classification, Sheets-auth remediation wording, and the first-run vs later-work identity rules.
