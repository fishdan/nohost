# nohost

A small public website hosted as a Google Apps Script web app. You do not need to be a programmer to get it running.  If you have a gmail account you can have a website using nohost.

## Get the public site on the internet

The intended path is to open this folder in an AI coding assistant and say:

> Read `start.ai` and keep going until `npm run doctor` prints **Public site: visible**. Ask me to click anything that needs a browser.

That is success. The assistant should also give you a link like `https://script.google.com/macros/s/.../exec` that opens without signing in. That script is this checkout's **master app**. Hello World is only the first version; later features (guestbook and anything after) go on the same site and the same link.

The assistant will ask you to:

1. Install **Git** (if needed) and **nvm**, then latest Node (`nvm install` / `nvm use` in this folder).
2. Turn on the [Apps Script API](https://script.google.com/home/usersettings) (a toggle on a Google page).
3. Sign in with Google when a browser window opens (`clasp login`).
4. Create a **new** Apps Script project for this repo **only if this checkout does not already have one**. Do not point this checkout at some other Google script you already have, and do not create a second nohost script after first-run.

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

Never commit `.clasp.json`, `.clasprc.json`, or anything under `.secrets/`. After `.clasp.json` exists, do not run `clasp create` again.

## Live site

This checkout's master app (the first-run Hello World project, later grown in place):

https://script.google.com/macros/s/AKfycbxXJwRMIr1CxEgSZcl3X45W4Nkd7NH6Xl__R6rjKqPzHDCKsGREwzAwXbQ62bCB3iyfbA/exec

- Sign: add `?page=sign`
- View: add `?page=view`

If `npm run doctor` reports 403 or missing Sheets access, open that view URL while signed in as the owner and approve Google. Then set **Who has access** to **Anyone** if visitors still cannot load it. Pitfalls (wrong Gmail, Share vs Deploy, iframe links) are in `specs/0/0.008-master-app-operability/notes.md`.

## After the public site is visible

Source lives in `src/`. `npm run build` writes Apps Script files into `dist/` (the clasp root). Change the site through GitHub: an assistant edits `src/`, you review a pull request, and GitHub Actions deploys **the same** master `/exec` URL.

If the doctor says the guestbook view page needs Sheets access, sign in as the Google account that ran clasp login for this checkout (doctor prints that email). Open the printed `/exec?page=view` link and approve Google. A different Gmail will see "You need access". Do not use the Apps Script editor Run dropdown.

```bash
npm run doctor -- --ci
npm run build
npm test
```

`npm run push` uploads to Apps Script. `npm run deploy` also creates or updates a versioned `/exec` URL. After GitHub production is configured, do not redeploy production from a laptop; first-time setup of a **new** nohost script may use `npm run deploy` locally so doctor can see a public URL.

## GitHub production

Production deploys from `main` via `.github/workflows/deploy.yml` onto **this checkout's master** `/exec` URL. Required in the GitHub `production` environment:

- Variable `CLASP_DEPLOYMENT_ID` (the versioned web-app deployment ID)
- Secrets `CLASP_PROJECT_JSON` (the local `.clasp.json`) and `CLASPRC_JSON` (clasp OAuth)

Google Cloud workload identity is optional. If `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` is set, the workflow also authenticates to Google Cloud; clasp itself deploys with `CLASPRC_JSON`. After that is working, do not redeploy production from a laptop.

## Ownership

The owner should control the GitHub repo, Google Cloud project, Apps Script project, and GitHub `production` environment. Keep at least two administrators. Do not put script IDs or tokens in git.
