import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

test('build output contains the Apps Script entry point and page partials', async () => {
  const code = await readFile('dist/Code.js', 'utf8');
  const page = await readFile('dist/index.html', 'utf8');
  assert.match(code, /function doGet\(\)/);
  assert.match(page, /Hello, world!/);
  assert.match(page, /The Web App is connected/);
  for (const file of ['appsscript.json', 'index.html', 'styles.html', 'scripts.html']) await access(`dist/${file}`);
});
