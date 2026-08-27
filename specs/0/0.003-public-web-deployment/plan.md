# Plan

1. Confirm the Apps Script manifest and deployment workflow express the intended public web-app behavior.
2. Document the production environment variables, secret, and one-time Google sharing steps needed by GitHub Actions.
3. Configure the GitHub production environment outside the repository using the approved project and deployment identifiers.
4. Run CI through a reviewed merge to `main`, then verify the versioned `/exec` URL without signing in.
