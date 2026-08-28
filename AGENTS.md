# nohost - Generic Google Apps Script Web App

Read and follow `start.ai` before doing any work.

## Working agreements

- GitHub is the source of truth. Make normal changes in `src/`, configuration, or documentation; do not edit the Apps Script browser editor directly.
- First-run creates **one** standalone Apps Script project: this checkout's master app. Hello World is only the first public version. Later features deploy into that same script and `/exec` URL. After `.clasp.json` exists, never create another nohost script and never attach a random project from `clasp list`.
- `main` represents production. Use a pull request for substantive changes.
- Run `npm run doctor -- --ci`, `npm run build`, and `npm test` before proposing a change.
- Never commit credentials, OAuth tokens, `.clasprc.json`, `.clasp.json`, service-account keys, or deployment secrets. The public `/exec` URL is not a secret; doctor should print it.
- First-time setup of a **new** nohost Apps Script project may use `npm run deploy` locally so `npm run doctor` can verify a public `/exec` URL. After GitHub production is configured, do not redeploy production from a laptop.
- Do not modify Google Cloud or deployment configuration unless the requested task requires it.
- Preserve existing visual and content conventions unless explicitly asked to change them.
- Keep the site simple and maintainable for a nontechnical maintainer and future AI assistants.
