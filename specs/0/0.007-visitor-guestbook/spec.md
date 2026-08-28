# Visitor guestbook

## Goal

Let public visitors sign a guestbook with their name and city, and let anyone view the submitted entries without being able to edit the underlying spreadsheet.

## User stories

1. As a visitor, I can open a **Sign the guestbook** page, enter my name and city, and submit the entry.
2. As a visitor, I receive a clear confirmation or error message after submitting.
3. As a visitor, I can open a **See the guestbook** page and read submitted names and cities.
4. As the site owner, I can review, correct, or remove entries in the connected Google Sheet without exposing edit access to the public.

## Functional requirements

- Provide separate public routes or navigation targets named **Sign the guestbook** and **See the guestbook**.
- The signing page contains required text inputs for `name` and `city`, with accessible labels and client-side feedback.
- Server-side code validates and normalizes both values before storing them; invalid or unavailable submissions do not create a row.
- Each valid submission appends one row to a dedicated `Visitors` worksheet with a server-generated timestamp, name, and city.
- The app creates one private owner-controlled spreadsheet on its first guestbook request and stores its connection through Apps Script configuration; no spreadsheet ID, credential, or token is committed to Git.
- The viewing page renders the stored name and city values as a read-only guestbook list. It must not expose spreadsheet editing controls, a public edit URL, or the underlying spreadsheet ID.
- Entries appear in a defined, documented order (newest first unless the implementation plan chooses an equally clear alternative).
- The public pages work for anonymous visitors on the deployed `/exec` URL.

## Privacy, safety, and abuse controls

- Collect only name and city. Do not request email addresses, precise addresses, or other personal data.
- Escape all stored values before rendering them in HTML.
- Apply practical request validation and duplicate/spam resistance appropriate to Google Apps Script; do not present a CAPTCHA unless the implementation task establishes a need.
- The public list shows only name and city, never timestamps or spreadsheet metadata.

## Scope boundaries

- This feature creates a guestbook only; it does not add user accounts, login, comments, likes, moderation dashboards, email notifications, or map features.
- The visitor form and public list are application pages backed by Google Sheets, not an embedded publicly shared Google Sheet.
- Creating or connecting a real spreadsheet and deploying the feature are external actions that require the owner's explicit approval at implementation time.

## Acceptance criteria

- A visitor can submit a valid name and city and the entry is appended to the configured `Visitors` worksheet.
- Invalid submissions are rejected with a helpful message and do not append a row.
- The view page shows submitted names and cities and has no editing affordances.
- The underlying Sheet is not publicly editable as a consequence of this feature.
- Automated tests cover validation, append/read boundaries, HTML escaping, and generated page content.
- The deployed anonymous `/exec` application supports both pages after owner-approved spreadsheet setup and deployment.
