# Guestbook notes

Feature pages live on the **master** Apps Script app from first-run. Operational pitfalls (second script, wrong Google account, Share vs Deploy, iframe links, doctor, GitHub) are in [../0.008-master-app-operability/notes.md](../0.008-master-app-operability/notes.md). Read that before deploy or owner auth.

Guestbook-specific:

- Collect only name and city. Sheet is private; ID stays in Script Properties.
- Nav and post-sign redirect must use `ScriptApp.getService().getUrl()` plus `target="_top"` / `window.top.location`. Relative `?page=` links do not work in the HtmlService iframe.
- After a valid sign, send the visitor to `?page=view` so they see the list (including their entry). Stay on the form when validation or duplicate throttle fails.
