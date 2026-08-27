# Public Web-App Deployment

## Goal

Make the Web App reachable from outside the Google account and organization so community visitors can open the published web-app URL without signing in.

## Scope

This feature covers the reviewed, versioned production deployment and its GitHub Actions configuration. The repository remains the source of truth, and production deployment is performed from `main` after review. The existing page content is unchanged.

## Acceptance criteria

- A versioned production web-app deployment exists for the Apps Script project.
- The production `/exec` URL can be opened in a private browser session without Google sign-in.
- The deployment executes as the authorized deploying account and serves the current repository build.
- GitHub Actions has the required production environment configuration to push and redeploy the approved version.
- No OAuth tokens, passwords, service-account keys, or deployment secrets are committed to the repository.
- Local build and test checks pass before production deployment.
