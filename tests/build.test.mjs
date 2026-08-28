import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('build output contains the Apps Script entry point and page partials', async () => {
  const code = await readFile('dist/Code.js', 'utf8');
  const page = await readFile('dist/index.html', 'utf8');
  const guestbookLogic = await readFile('dist/guestbook-logic.js', 'utf8');
  assert.match(code, /function doGet\(event\)/);
  assert.match(code, /function createGuestbookSpreadsheet\(\)/);
  assert.match(page, /Sign the guestbook/);
  assert.match(page, /See the guestbook/);
  assert.match(page, /guestbook-form/);
  assert.match(page, /guestbook-entries/);
  assert.match(guestbookLogic, /function validateGuestbookEntry/);
  assert.doesNotMatch(guestbookLogic, /export /);
  for (const file of ['appsscript.json', 'index.html', 'styles.html', 'scripts.html', 'guestbook-logic.js']) await access(`dist/${file}`);
  const manifest = JSON.parse(await readFile('dist/appsscript.json', 'utf8'));
  assert.equal(manifest.webapp.access, 'ANYONE_ANONYMOUS');
});
