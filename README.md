# nohost - Generic Google Apps Script Web App

This repository is the source of truth for a small public Web App hosted as a Google Apps Script web app. It uses TypeScript for server entry points, plain HTML/CSS/JavaScript for the page, npm for local development, and clasp for Google synchronization.

## Architecture

Source lives in `src/`. `npm run build` compiles TypeScript and copies the HTML partials and Apps Script manifest into `dist/`, which is the clasp root directory. GitHub Actions checks pull requests and deploys `main` to the production Apps Script project.

## Local development

Requirements: Node.js 20+, npm, and a Google account with access to the Apps Script project.

```bash
npm install
npm run build
npm test
```

To connect a local checkout after the Google project exists:

```bash
npx clasp login
npx clasp create --title "nohost Web App" --type webapp
# or copy .clasp.json.example to .clasp.json and fill in the script ID
npm run push
npx clasp deployments
```

Keep `.clasp.json` local. Review the web app's deployment access and execution settings in Apps Script before sharing its URL.

## Google bootstrap

```bash
export GOOGLE_CLOUD_PROJECT_ID=your-cloud-project-id
npm run bootstrap:google
```

The script enables required APIs and creates a narrowly scoped GitHub OIDC workload identity pool, provider, and deploy service account. It does not bypass Google security controls or create credentials. The operator must still enable the Apps Script API in Apps Script user settings, create/connect the script, share it with the deploy service account as Editor, and create/review the first web-app deployment. Apps Script projects cannot be owned by service accounts.

## Deployments

For a local development push, configure `.clasp.json` and run `npm run push`. Treat `npm run deploy` as an operator command: it pushes, creates a version, and either updates `CLASP_DEPLOYMENT_ID` or creates a new deployment when that variable is absent.

Production deployment runs only from `main` through `.github/workflows/deploy.yml`. Configure a GitHub environment named `production` with variables `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_WORKLOAD_IDENTITY_PROVIDER`, `GOOGLE_DEPLOY_SERVICE_ACCOUNT`, and `CLASP_DEPLOYMENT_ID` after the first reviewed deployment. Configure secret `CLASP_PROJECT_JSON` with the contents of `.clasp.json`, including the production script ID and `rootDir: "dist"`.

For the first public deployment, an administrator must complete these one-time steps:

1. In Apps Script, create or review a versioned Web app deployment. Set it to execute as the deploying user and allow anyone, including anonymous visitors. Record its deployment ID.
2. In Google Cloud, enable the Apps Script API and configure the GitHub OIDC workload identity described by `scripts/bootstrap-google.sh`.
3. Share the Apps Script project with the deploy service account as Editor. Apps Script projects cannot be owned by service accounts.
4. In the GitHub `production` environment, add the four variables above and add `CLASP_PROJECT_JSON` as an environment secret. Its value must contain only the local clasp configuration, for example `{"scriptId":"...","rootDir":"dist"}`.
5. Merge the reviewed change to `main` and let GitHub Actions run the production deployment. Verify the resulting `/exec` URL in a private browser window; it must load without Google sign-in.

The `/dev` test URL is not the public URL: it is restricted to script editors. Public visitors use the versioned deployment's `/exec` URL. Keep the production deployment ID stable so GitHub Actions can redeploy the same URL.

The workflow uses GitHub OIDC with `google-github-actions/auth@v3` for Cloud setup and a tightly controlled `CLASPRC_JSON` environment secret for clasp's Apps Script upload. The current clasp service-account/ADC path is experimental and does not support GitHub external-account credentials reliably. Generate `CLASPRC_JSON` with `clasp login`, rotate it periodically, and never commit it. The Apps Script project should still be shared with the deploy service account for the Cloud-managed deployment path.

## Ownership and recovery

The project owner should own the GitHub organization/repository, Google Cloud project, Apps Script project, production deployment, and GitHub environment. Keep at least two administrators on each system. Store project ID, script ID, deployment ID, and recovery contacts in approved project records—not in repository secrets or source files. If the original developer leaves, an administrator can regain access through those owners, rotate the GitHub environment configuration, and reauthorize clasp or replace the workload identity service account without changing website source.

## Maintenance workflow

Ask an AI coding assistant for a concrete content or feature change. It should edit this repository, run the build and tests, summarize the diff, and prepare a pull request. A human reviews and merges the change; GitHub Actions then deploys `main` to the reviewed production Apps Script deployment.
