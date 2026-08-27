# nohost

A small public website hosted as a Google Apps Script web app. You do not need to be a programmer to get it running.

## Get Hello World on the internet

The intended path is to open this folder in an AI coding assistant and say:

> Read `start.ai` and keep going until `npm run doctor` prints **Public Hello World: visible**. Ask me to click anything that needs a browser.

That is success. You should also get a link like `https://script.google.com/macros/s/.../exec` that shows **Hello, world!** without signing in.

The assistant will ask you to:

1. Install **Git** (if needed) and **nvm**, then latest Node (`nvm install` / `nvm use` in this folder).
2. Turn on the [Apps Script API](https://script.google.com/home/usersettings) (a toggle on a Google page).
3. Sign in with Google when a browser window opens (`clasp login`).
4. Create a **new** Apps Script project for this repo. Do not point this checkout at some other Google script you already have.

If you prefer to run commands yourself, start here (same outcome):

```bash
nvm install
nvm use
npm run doctor -- --fix
```

Then keep doing what `npm run doctor` prints until it passes. Important details the doctor will ask for:

- Login: `mkdir -p .secrets && npx clasp login --auth .secrets/.clasprc.json`
- New project (clasp 3 needs **standalone**, not `webapp`):

```bash
npm run build
clasp_config_auth=.secrets/.clasprc.json npx clasp create --title "nohost Web App" --type standalone --rootDir dist
npm run deploy
npm run doctor
```

Never commit `.clasp.json`, `.clasprc.json`, or anything under `.secrets/`.

## After Hello World is public

Source lives in `src/`. `npm run build` writes Apps Script files into `dist/` (the clasp root). Change the site through GitHub: an assistant edits `src/`, you review a pull request, and GitHub Actions deploys `main`.

```bash
npm run doctor -- --ci
npm run build
npm test
```

`npm run push` uploads to Apps Script. `npm run deploy` also creates or updates a versioned `/exec` URL. After GitHub production is configured, do not redeploy production from a laptop; first-time setup of a **new** nohost script may use `npm run deploy` locally so doctor can see a public URL.

## GitHub production (optional, later)

Production deploys from `main` via `.github/workflows/deploy.yml`. That needs a GitHub environment named `production` with `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_WORKLOAD_IDENTITY_PROVIDER`, `GOOGLE_DEPLOY_SERVICE_ACCOUNT`, `CLASP_DEPLOYMENT_ID`, and secrets `CLASP_PROJECT_JSON` and `CLASPRC_JSON`. Cloud bootstrap:

```bash
export GOOGLE_CLOUD_PROJECT_ID=your-cloud-project-id
npm run bootstrap:google
```

Share the Apps Script project with the deploy service account as Editor. Apps Script projects cannot be owned by service accounts. The `/dev` URL is private; visitors use the versioned `/exec` URL.

## Ownership

The owner should control the GitHub repo, Google Cloud project, Apps Script project, and GitHub `production` environment. Keep at least two administrators. Do not put script IDs or tokens in git.
