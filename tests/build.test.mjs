import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('build output contains the Apps Script entry point and page partials', async () => {
  const code = await readFile('dist/Code.js', 'utf8');
  const page = await readFile('dist/index.html', 'utf8');
  const guestbookLogic = await readFile('dist/guestbook-logic.js', 'utf8');
  assert.match(code, /function doGet\(event\)/);
  assert.match(code, /ScriptApp\.getService\(\)\.getUrl\(\)/);
  assert.match(code, /function createGuestbookSpreadsheet\(\)/);
  assert.match(page, /Sign the guestbook/);
  assert.match(page, /See the guestbook/);
  assert.match(page, /webAppUrl \?>\?page=sign/);
  assert.match(page, /target="_top"/);
  assert.match(page, /NOHOST_WEB_APP_URL/);
  const guestbookScripts = await readFile('dist/scripts.html', 'utf8');
  assert.match(guestbookScripts, /page=view/);
  assert.match(guestbookScripts, /window\.top\.location\.href/);
  assert.match(page, /guestbook-entries/);
  assert.match(guestbookLogic, /function validateGuestbookEntry/);
  assert.doesNotMatch(guestbookLogic, /export /);
  for (const file of ['appsscript.json', 'index.html', 'styles.html', 'scripts.html', 'guestbook-logic.js']) await access(`dist/${file}`);
  const manifest = JSON.parse(await readFile('dist/appsscript.json', 'utf8'));
  assert.equal(manifest.webapp.access, 'ANYONE_ANONYMOUS');
});

test('styles host a :root color palette and rules use it', async () => {
  const styles = await readFile('dist/styles.html', 'utf8');
  const rootMatch = styles.match(/:root\s*\{[\s\S]*?\}/);
  assert.ok(rootMatch, 'expected a :root palette block');
  const root = rootMatch[0];
  const tokens = [
    '--color-text:',
    '--color-text-muted:',
    '--color-accent:',
    '--color-accent-strong:',
    '--color-page:',
    '--color-surface:',
    '--color-on-accent:',
    '--color-border:',
    '--color-border-input:',
    '--shadow-card:',
  ];
  for (const token of tokens) {
    assert.match(root, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(root, /--color-text:\s*#17324d/);
  assert.match(root, /--color-accent:\s*#176579/);
  assert.match(root, /--color-page:\s*#f4f7f9/);
  const rules = styles.slice(rootMatch.index + root.length);
  assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(rules, /rgb\(/);
  assert.match(rules, /\.eyebrow\s*\{[^}]*color:\s*var\(--color-accent-strong\)/);
  assert.match(rules, /a\s*\{[^}]*color:\s*var\(--color-accent\)/);
  assert.match(rules, /button\s*\{[^}]*background:\s*var\(--color-accent\)/);
});
