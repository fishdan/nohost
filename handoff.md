# Guestbook authorization

The visitor guestbook lives on this checkout's **master** Apps Script web app (the same project first-run created). Do not create a second script, and do not use the Apps Script editor Run dropdown.

Public site:

https://script.google.com/macros/s/AKfycbxXJwRMIr1CxEgSZcl3X45W4Nkd7NH6Xl__R6rjKqPzHDCKsGREwzAwXbQ62bCB3iyfbA/exec

If `npm run doctor` says the site is 403 or the view page needs Google Sheets access:

1. Sign in as the site owner.
2. Open https://script.google.com/macros/s/AKfycbxXJwRMIr1CxEgSZcl3X45W4Nkd7NH6Xl__R6rjKqPzHDCKsGREwzAwXbQ62bCB3iyfbA/exec?page=view
3. Approve Google access if Google asks.
4. If signed-out visitors still cannot load the site: Deploy → Manage deployments → edit the web app → **Who has access: Anyone** → Deploy.
5. Re-run `npm run doctor`.

Anonymous visitors can then use **Sign the guestbook** and **See the guestbook** on that same `/exec` URL.
