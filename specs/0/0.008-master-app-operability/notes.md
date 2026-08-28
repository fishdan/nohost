# Operability notes

Lessons from standing up Hello World, then guestbook, on one Google Apps Script website. Read this before `clasp create`, deploy, Sheets auth, or telling a human which URL to open.

## One master app

First-run creates **the** website. Guestbook and every later feature belong in that same Apps Script project, same ignored `.clasp.json`, same versioned `/exec` URL.

**What went wrong:** Guestbook code was published on a *second* script. This checkout still pointed at Hello World. Neither a human nor an assistant could answer “where is the site?” from the repo. Doctor checked Hello World; the guestbook lived elsewhere.

**Do this instead:** After `.clasp.json` exists, never `clasp create` again. Never attach a random project from `clasp list` (this Google account also owns unrelated scripts). Only reuse a script ID if the human says *this* checkout’s master nohost app.

## Which Google account owns the site

The owner is the Google account that ran `clasp login` into `.secrets/.clasprc.json`. `npm run doctor` prints that email.

**What went wrong:** The human opened the `/exec` URL while signed in as `fishdan@gmail.com`. The master app is owned by `dan@people4liberty.org`. Google showed Drive **You need access**, not the guestbook. Handoffs that said “sign in as the site owner” were read as the daily Gmail, which was wrong.

**Do this instead:** If the human sees **You need access**, they are on the wrong Google account. Switch to the clasp login email the doctor printed. Do not create a new script to “fix” access.

## Public URL vs script ID vs Share

| Thing | Looks like | In git? |
| --- | --- | --- |
| Public site | `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec` | Yes once stable (README). Not a secret. |
| Script editor | `https://script.google.com/d/<SCRIPT_ID>/edit` | No. `.clasp.json` is gitignored. |
| Drive Share dialog | “Anyone with the link can view” | Wrong tool for visitors. |

**What went wrong:** Assistants could not find the visitor link (it is not the editor URL). Humans opened **Share** and set “Anyone with the link / Viewer”, which shares the *script file*, not the web app.

**Do this instead:** Doctor prints `/exec`. README **Live site** has the same link. Visitor access is **Deploy → Manage deployments → pencil on the Web app → Who has access: Anyone → Deploy**. Execute as **Me**. “Anyone with a Google account” is not anonymous.

## Sheets and 403 after adding SpreadsheetApp

The guestbook creates a private Sheet on first view and stores its ID in Script Properties (not git). The web app runs as the owner, so visitors do not log in to Sheets. The owner must authorize SpreadsheetApp once.

**What went wrong:** Instructions said to open the Apps Script editor, pick `getGuestbookEntries`, and click Run (including unverified-app **Advanced → Go to app**). That is editor ritual, not how this site is maintained. Adding Sheets also made anonymous `/exec` return 403 until **Who has access** was **Anyone** again.

**Do this instead:** Signed in as the clasp account, open `/exec?page=view` and approve Google if asked. Then confirm Manage deployments **Anyone**. Re-run doctor. Never tell the human to use the function dropdown.

## HtmlService iframe links

Apps Script serves HTML inside a `googleusercontent.com` iframe. Relative links like `href="?page=sign"` do not change the real `/exec` URL. Clicks look dead.

**Do this instead:** Pass `ScriptApp.getService().getUrl()` into the template as `webAppUrl`. Use `href="<?= webAppUrl ?>?page=sign" target="_top"`. After a successful sign, set `window.top.location.href` to that URL with `?page=view`. Workaround if links are stale: put `?page=sign` or `?page=view` on the `/exec` URL in the address bar. Hard-refresh after a deploy.

## Doctor follows the current site

Doctor success is **Public site: visible**, not a forever `Hello, world!` fingerprint. It must fetch home, `?page=sign`, and `?page=view` on this checkout’s `/exec`. `--ci` is toolchain only.

## GitHub production

`.github/workflows/deploy.yml` deploys `main` onto **this** script and **this** `CLASP_DEPLOYMENT_ID`. Clasp uses secrets `CLASP_PROJECT_JSON` and `CLASPRC_JSON`. Cloud workload identity is optional; if the provider var is empty, skip WIF. Missing WIF used to fail every production run before clasp ran.

After GitHub production actually deploys, do not redeploy production from a laptop unless the human asks for a one-time test deploy.

## Never

- Commit `.clasp.json`, `.clasprc.json`, tokens, or spreadsheet IDs.
- `clasp create --type webapp` (clasp 3 rejects it; use `--type standalone` for first-run only).
- Treat the Apps Script browser editor as the place to change the site (`src/` and GitHub are).
- Assume the human’s everyday Gmail is the clasp owner.
- Assume Share = web app **Who has access**.
