# Guestbook authorization

The visitor guestbook lives on this checkout's **master** Apps Script web app (the same project first-run created). Do not create a second script, and do not use the Apps Script editor Run dropdown.

This script is owned by **dan@people4liberty.org** (the clasp login on this machine). Opening the site while signed in as **fishdan@gmail.com** shows Google Drive **You need access**.

Public site:

https://script.google.com/macros/s/AKfycbxXJwRMIr1CxEgSZcl3X45W4Nkd7NH6Xl__R6rjKqPzHDCKsGREwzAwXbQ62bCB3iyfbA/exec

1. In the browser, switch to **dan@people4liberty.org**.
2. Open https://script.google.com/macros/s/AKfycbxXJwRMIr1CxEgSZcl3X45W4Nkd7NH6Xl__R6rjKqPzHDCKsGREwzAwXbQ62bCB3iyfbA/exec?page=view
3. Approve Google Sheets / Drive access if Google asks.
4. If signed-out visitors still cannot load the site: Deploy → Manage deployments → edit the web app → **Who has access: Anyone** → Deploy.
5. Re-run `npm run doctor`.

See `specs/0/0.008-master-app-operability/notes.md` for the full list of pitfalls (wrong Gmail, Share vs Deploy, iframe links, second script).
