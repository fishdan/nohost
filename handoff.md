# Guestbook authorization handoff

The visitor guestbook code is merged and deployed. One owner-only Google Apps Script authorization remains before anonymous visitors can use the guestbook.

1. Sign in as `fishdan@gmail.com` and open:
   `https://script.google.com/d/1SQW7WSdaWjIpBtxBZ9ulhrRy5KlCqAm6WO5YwuJjlf2QIWRHKk-e-yHs/edit`
2. In the function dropdown beside **Debug**, select `getGuestbookEntries` (not `doGet`).
3. Click **Run**.
4. In Google's authorization dialog, select `fishdan@gmail.com`, choose **Review permissions**, then choose **Allow**.
5. Wait for the execution to complete successfully.

This grants the new Sheets scope and creates/configures the private `Visitors` worksheet. No browser-editor code changes are needed.
