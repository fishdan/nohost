# nohost - Generic Google Apps Script Web App

Read and follow `start.ai` before doing any work.

## Working agreements

- GitHub is the source of truth. Make normal changes in `src/`, configuration, or documentation; do not edit the Apps Script browser editor directly.
- `main` represents production. Use a pull request for substantive changes.
- Run `npm run doctor -- --ci`, `npm run build`, and `npm test` before proposing a change.
- Never commit credentials, OAuth tokens, `.clasprc.json`, `.clasp.json`, service-account keys, or deployment secrets.
- Production deployment is handled by GitHub Actions. Do not deploy casually from a local machine.
- Do not modify Google Cloud or deployment configuration unless the requested task requires it.
- Preserve existing visual and content conventions unless explicitly asked to change them.
- Keep the site simple and maintainable for a nontechnical maintainer and future AI assistants.
