import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  clasprcLooksValid,
  clasprcRemediation,
  claspAccountEmail,
  claspJsonRemediation,
  classifyAnonymousPage,
  classifyPublicResponse,
  createIo,
  extractJsonValue,
  formatReport,
  isLatestAlias,
  isPlaceholderScriptId,
  looksLikeSheetsAuthorizationFailure,
  ownerSignInLine,
  parseArgs,
  parseNpmDoctorOutput,
  PUBLIC_HOME_MARKERS,
  publicSiteRemediation,
  runChecks,
  sheetsAuthorizationRemediation,
  summarize,
  versionedDeploymentIds,
  webAppExecUrl,
} from '../scripts/doctor.mjs';

const HEALTHY_NPM_DOCTOR = [
  'Connecting to the registry',
  'Ok',
  'Checking npm version',
  'Ok',
  'Checking node version',
  'Ok',
  'Checking configured npm registry',
  'Ok',
  'Checking for git executable in PATH',
  'Ok',
  'Checking for global bin folder in PATH',
  'Ok',
].join('\n');

function mockIo(overrides = {}) {
  const files = {
    '/repo/package.json': JSON.stringify({ scripts: { doctor: 'node scripts/doctor.mjs' } }),
    '/repo/.nvmrc': 'node\n',
    '/repo/.clasp.json.example': JSON.stringify({ scriptId: 'REPLACE_WITH_APPS_SCRIPT_ID', rootDir: 'dist' }),
  };
  const existing = new Set([
    '/repo/package.json',
    '/repo/.nvmrc',
    '/repo/.clasp.json.example',
    '/repo/node_modules',
    '/repo/node_modules/@google/clasp',
    '/repo/node_modules/typescript',
  ]);
  return createIo({
    root: '/repo',
    homedir: '/home/dev',
    nodeVersion: 'v24.20.0',
    env: {},
    exists: (path) => existing.has(path),
    read: (path) => {
      if (!(path in files)) throw new Error(`missing ${path}`);
      return files[path];
    },
    spawn: (command, args) => {
      if (command === 'npm' && args[0] === '-v') return { status: 0, stdout: '11.6.2\n', stderr: '' };
      if (command === 'npm' && args[0] === 'doctor') {
        return { status: 0, stdout: `${HEALTHY_NPM_DOCTOR}\n`, stderr: '' };
      }
      if (command === 'git' && args[0] === '--version') return { status: 0, stdout: 'git version 2.43.0\n', stderr: '' };
      if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'true\n', stderr: '' };
      if (command === 'git' && args[0] === 'branch') return { status: 0, stdout: 'main\n', stderr: '' };
      if (command === 'specify') return { status: 0, stdout: 'specify 0.16.4\n', stderr: '' };
      return { status: 1, stdout: '', stderr: 'unexpected', error: { code: 'ENOENT' } };
    },
    ...overrides,
    files,
    existing,
  });
}

test('parseArgs accepts ci, fix, and help flags', () => {
  assert.deepEqual(parseArgs(['--ci', '--fix']), { ci: true, fix: true, help: false });
  assert.deepEqual(parseArgs(['--ci']), { ci: true, fix: false, help: false });
  assert.deepEqual(parseArgs(['--fix']), { ci: false, fix: true, help: false });
  assert.deepEqual(parseArgs(['--help']), { ci: false, fix: false, help: true });
});

test('latest aliases are node, latest, and current — not a pinned major', () => {
  assert.equal(isLatestAlias('node'), true);
  assert.equal(isLatestAlias('latest'), true);
  assert.equal(isLatestAlias('current'), true);
  assert.equal(isLatestAlias('20'), false);
  assert.equal(isLatestAlias('>=20'), false);
});

test('placeholder script IDs are rejected', () => {
  assert.equal(isPlaceholderScriptId('REPLACE_WITH_APPS_SCRIPT_ID'), true);
  assert.equal(isPlaceholderScriptId(''), true);
  assert.equal(isPlaceholderScriptId('1abcRealScriptId'), false);
});

test('claspAccountEmail reads the login email from the id_token', () => {
  const payload = Buffer.from(JSON.stringify({ email: 'owner@example.com' })).toString('base64url');
  assert.equal(claspAccountEmail({ tokens: { default: { id_token: `e30.${payload}.sig` } } }), 'owner@example.com');
  assert.equal(claspAccountEmail({}), '');
  assert.match(ownerSignInLine('owner@example.com'), /owner@example.com/);
  assert.match(ownerSignInLine('owner@example.com'), /You need access/);
});

test('clasprcLooksValid accepts current and legacy credential shapes', () => {
  assert.equal(clasprcLooksValid({ tokens: { default: { refresh_token: 'x' } } }), true);
  assert.equal(clasprcLooksValid({ token: { refresh_token: 'x' } }), true);
  assert.equal(clasprcLooksValid({ access_token: 'a', refresh_token: 'b' }), true);
  assert.equal(clasprcLooksValid({}), false);
});

test('npm doctor output parser treats Not ok as failure and captures Use lines', () => {
  const failed = parseNpmDoctorOutput('Checking node version\nNot ok\nUse node v24.20.0 (current: v20.19.5)\n');
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.failures, ['Checking node version']);
  assert.deepEqual(failed.recommendations, ['Use node v24.20.0 (current: v20.19.5)']);
  assert.equal(parseNpmDoctorOutput('Connecting to the registry\nOk\n').ok, true);
});

test('versioned deployments become /exec URLs', () => {
  const ids = versionedDeploymentIds([
    { deploymentId: 'head-id', description: 'HEAD' },
    { deploymentId: 'pub-id', versionNumber: 12, description: 'main' },
  ]);
  assert.deepEqual(ids, ['pub-id']);
  assert.equal(webAppExecUrl('pub-id'), 'https://script.google.com/macros/s/pub-id/exec');
});

test('extractJsonValue ignores leading clasp spinner text', () => {
  const parsed = extractJsonValue('Fetching...\n[{"deploymentId":"abc","versionNumber":1}]');
  assert.equal(parsed[0].deploymentId, 'abc');
});

test('classifyAnonymousPage requires current home markers, not Hello World', () => {
  const home = '<h1>Welcome to your own nohost</h1><a href="?page=sign">Sign the guestbook</a><a href="?page=view">See the guestbook</a>';
  assert.equal(classifyAnonymousPage({ status: 200, body: home }, PUBLIC_HOME_MARKERS).ok, true);
  assert.equal(classifyPublicResponse({ status: 200, body: home }).ok, true);
  assert.equal(classifyAnonymousPage({ status: 200, body: '<h1>Hello, world!</h1>' }, PUBLIC_HOME_MARKERS).ok, false);
  assert.equal(classifyAnonymousPage({ status: 302, location: 'https://accounts.google.com/ServiceLogin' }, PUBLIC_HOME_MARKERS).ok, false);
  assert.equal(classifyAnonymousPage({ status: 200, body: '<html>sign in</html>' }, PUBLIC_HOME_MARKERS).ok, false);
});

test('Sheets authorization failures tell the owner to open ?page=view, not the editor', () => {
  assert.equal(
    looksLikeSheetsAuthorizationFailure({ body: 'Exception: You do not have permission to call SpreadsheetApp.create' }),
    true,
  );
  const verdict = classifyAnonymousPage(
    { status: 200, body: 'Authorization required to use SpreadsheetApp' },
    ['guestbook-entries'],
  );
  assert.equal(verdict.ok, false);
  assert.equal(verdict.kind, 'sheets-auth');
  const fix = sheetsAuthorizationRemediation(
    'https://script.google.com/macros/s/pub-id/exec?page=view',
    'owner@example.com',
  );
  assert.match(fix, /\?page=view/);
  assert.match(fix, /Sign in as owner@example.com/);
  assert.match(fix, /You need access/);
  assert.match(fix, /Do not use the Apps Script editor/);
  assert.doesNotMatch(fix, /getGuestbookEntries/);
  assert.match(publicSiteRemediation('https://script.google.com/macros/s/pub-id/exec'), /Do not create a second Apps Script project/);
});

test('clasprc remediation tells the user how to login and store credentials', () => {
  const text = clasprcRemediation({ homeExists: true });
  assert.match(text, /clasp login --auth \.secrets\/\.clasprc\.json/);
  assert.match(text, /npm run doctor -- --fix/);
  assert.match(text, /script\.google\.com\/home\/usersettings/);
});

test('clasp project remediation creates a new standalone script only when the master app is missing', () => {
  const text = claspJsonRemediation();
  assert.match(text, /--type standalone/);
  assert.doesNotMatch(text, /--type webapp/);
  assert.match(text, /npm run deploy/);
  assert.match(text, /do not attach a random existing script/i);
  assert.match(text, /do not create another script/i);
});

test('README and start.ai treat first-run as creating the master app', async () => {
  const readme = await readFile('README.md', 'utf8');
  const start = await readFile('start.ai', 'utf8');
  assert.match(readme, /Public site: visible/);
  assert.match(readme, /Read `start\.ai`/);
  assert.match(readme, /--type standalone/);
  assert.doesNotMatch(readme, /clasp create[^\n]*--type webapp/);
  assert.match(start, /First-run until the public site is visible/);
  assert.match(start, /--type standalone/);
  assert.doesNotMatch(start, /clasp create[^\n]*--type webapp/);
  assert.match(start, /the current task/);
  assert.match(start, /never create another nohost script/i);
  assert.match(start, /do not pick a function from the Run dropdown/i);
  assert.match(start, /You need access/);
  assert.match(start, /0\.008-master-app-operability\/notes\.md/);
});

test('doctor fetches home, sign, and view on the printed /exec URL', async () => {
  const home = '<h1>Welcome to your own nohost</h1><a href="?page=sign">Sign the guestbook</a><a href="?page=view">See the guestbook</a>';
  const pages = {
    'https://script.google.com/macros/s/pub-id/exec': home,
    'https://script.google.com/macros/s/pub-id/exec?page=sign': '<form id="guestbook-form"></form>',
    'https://script.google.com/macros/s/pub-id/exec?page=view': '<ul id="guestbook-entries"></ul>',
  };
  const io = mockIo({
    env: { CLASP_WEB_APP_URL: 'https://script.google.com/macros/s/pub-id/exec' },
    fetch: async (url) => ({
      status: 200,
      headers: { get: () => '' },
      text: async () => pages[url] || '',
    }),
  });
  io.existing.add('/repo/.secrets/.clasprc.json');
  io.existing.add('/repo/.clasp.json');
  io.files['/repo/.secrets/.clasprc.json'] = JSON.stringify({ tokens: { default: { refresh_token: 'x' } } });
  io.files['/repo/.clasp.json'] = JSON.stringify({ scriptId: '1abcRealScriptId', rootDir: 'dist' });
  const originalSpawn = io.spawn;
  io.spawn = (command, args) => {
    if (command === 'npx' && args[0] === 'clasp' && args[1] === 'status') {
      return { status: 0, stdout: 'Tracked files:\n', stderr: '' };
    }
    return originalSpawn(command, args);
  };

  const results = await runChecks({}, io);
  const summary = summarize(results);
  assert.equal(summary.publicSite, 'visible');
  assert.equal(results.find((row) => row.id === 'public-home').status, 'pass');
  assert.equal(results.find((row) => row.id === 'public-sign').status, 'pass');
  assert.equal(results.find((row) => row.id === 'public-view').status, 'pass');
  const report = formatReport(results, { color: false });
  assert.match(report, /Public site: visible/);
  assert.match(report, /https:\/\/script\.google\.com\/macros\/s\/pub-id\/exec/);
});

test('view-page Sheets denial uses owner-in-browser remediation', async () => {
  const io = mockIo({
    env: { CLASP_WEB_APP_URL: 'https://script.google.com/macros/s/pub-id/exec' },
    fetch: async (url) => ({
      status: 200,
      headers: { get: () => '' },
      text: async () => {
        if (String(url).includes('page=view')) return 'Exception: You do not have permission to call SpreadsheetApp.create';
        if (String(url).includes('page=sign')) return '<form id="guestbook-form"></form>';
        return '<h1>Welcome to your own nohost</h1><a href="?page=sign">Sign the guestbook</a><a href="?page=view">See the guestbook</a>';
      },
    }),
  });
  io.existing.add('/repo/.secrets/.clasprc.json');
  io.existing.add('/repo/.clasp.json');
  io.files['/repo/.secrets/.clasprc.json'] = JSON.stringify({ tokens: { default: { refresh_token: 'x' } } });
  io.files['/repo/.clasp.json'] = JSON.stringify({ scriptId: '1abcRealScriptId', rootDir: 'dist' });
  const originalSpawn = io.spawn;
  io.spawn = (command, args) => {
    if (command === 'npx' && args[0] === 'clasp' && args[1] === 'status') {
      return { status: 0, stdout: 'Tracked files:\n', stderr: '' };
    }
    return originalSpawn(command, args);
  };

  const results = await runChecks({}, io);
  const view = results.find((row) => row.id === 'public-view');
  assert.equal(view.status, 'fail');
  assert.match(view.fix, /\?page=view/);
  assert.doesNotMatch(view.fix, /getGuestbookEntries/);
  assert.equal(summarize(results).publicSite, 'not visible');
});

test('fresh clone without clasp credentials fails deploy checks with remediations', async () => {
  const results = await runChecks({}, mockIo());
  const summary = summarize(results);
  assert.equal(summary.developReady, true);
  assert.equal(summary.deployReady, false);
  assert.equal(summary.publicSite, 'unchecked');
  const clasprc = results.find((row) => row.id === 'clasprc');
  assert.equal(clasprc.status, 'fail');
  assert.match(clasprc.fix, /npx clasp login/);
  const report = formatReport(results, { color: false });
  assert.match(report, /\[FAIL\] Missing clasp credentials/);
  assert.match(report, /Local build\/test can continue/);
});

test('--ci skips clasp and public checks', async () => {
  const results = await runChecks({ ci: true }, mockIo());
  const summary = summarize(results);
  assert.equal(summary.ok, true);
  assert.equal(summary.deployReady, null);
  assert.equal(results.some((row) => row.group === 'deploy' || row.group === 'public'), false);
});

test('stale Node fails when npm doctor versions is Not ok', async () => {
  const io = mockIo({
    nodeVersion: 'v20.19.5',
    spawn: (command, args) => {
      if (command === 'npm' && args[0] === '-v') return { status: 0, stdout: '10.8.2\n', stderr: '' };
      if (command === 'npm' && args[0] === 'doctor') {
        return {
          status: 1,
          stdout: 'Checking npm version\nNot ok\nUse npm v12.0.2\nChecking node version\nNot ok\nUse node v24.20.0 (current: v20.19.5)\nChecking for git executable in PATH\nOk\n',
          stderr: '',
        };
      }
      if (command === 'git' && args[0] === '--version') return { status: 0, stdout: 'git version 2.43.0\n', stderr: '' };
      if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'true\n', stderr: '' };
      if (command === 'git' && args[0] === 'branch') return { status: 0, stdout: 'main\n', stderr: '' };
      return { status: 0, stdout: 'ok\n', stderr: '' };
    },
  });
  const results = await runChecks({ ci: true }, io);
  assert.equal(summarize(results).developReady, false);
  const doctor = results.find((row) => row.id === 'npm-doctor');
  assert.equal(doctor.status, 'fail');
  assert.match(doctor.fix, /nvm install node/);
  assert.match(doctor.fix, /Use node v24\.20\.0/);
});

test('missing node_modules is a develop failure', async () => {
  const io = mockIo({
    exists: (path) => path !== '/repo/node_modules' && !path.includes('node_modules'),
  });
  const results = await runChecks({ ci: true }, io);
  assert.equal(summarize(results).developReady, false);
  assert.equal(results.find((row) => row.id === 'node-modules').status, 'fail');
  assert.match(results.find((row) => row.id === 'node-modules').fix, /npm install/);
});

test('missing git is reported with an install hint instead of a cryptic spawn error', async () => {
  const io = mockIo({
    spawn: (command, args) => {
      if (command === 'git') return { status: 1, stdout: '', stderr: '', error: { code: 'ENOENT' } };
      if (command === 'npm' && args[0] === '-v') return { status: 0, stdout: '10.8.2\n', stderr: '' };
      if (command === 'npm' && args[0] === 'doctor') {
        return { status: 1, stdout: 'Checking for git executable in PATH\nNot ok\n', stderr: '' };
      }
      return { status: 0, stdout: 'ok\n', stderr: '' };
    },
  });
  const results = await runChecks({ ci: true }, io);
  const git = results.find((row) => row.id === 'git');
  assert.equal(git.status, 'fail');
  assert.match(git.fix, /git-scm\.com/);
});

test('production deploy uses clasp OAuth and does not require Cloud WIF', async () => {
  const yml = await readFile('.github/workflows/deploy.yml', 'utf8');
  assert.match(yml, /CLASPRC_JSON/);
  assert.match(yml, /CLASP_PROJECT_JSON/);
  assert.match(yml, /CLASP_DEPLOYMENT_ID/);
  assert.match(yml, /vars\.GOOGLE_WORKLOAD_IDENTITY_PROVIDER != ''/);
});

test('CI installs latest Node and latest npm before the doctor gate', async () => {
  const ci = await readFile('.github/workflows/ci.yml', 'utf8');
  assert.match(ci, /node-version:\s*latest/);
  assert.match(ci, /npm install -g npm@latest/);
  assert.match(ci, /actions\/setup-node@v7/);
});

test('package.json has a doctor script and .nvmrc tracks latest, not a major number', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const nvmrc = (await readFile('.nvmrc', 'utf8')).trim();
  assert.equal(pkg.engines, undefined);
  assert.equal(pkg.scripts.doctor, 'node scripts/doctor.mjs');
  assert.equal(isLatestAlias(nvmrc), true);
});

test('start.ai gates sessions on npm run doctor', async () => {
  const start = await readFile('start.ai', 'utf8');
  assert.match(start, /npm run doctor/);
  assert.match(start, /Doctor:/);
});

test('start.ai requires permission before consequential startup remediation', async () => {
  const start = await readFile('start.ai', 'utf8');
  assert.match(start, /Permission Gates for Startup Remediation/);
  assert.match(start, /ask for and receive explicit human permission/i);
  assert.match(start, /Installs, upgrades, or changes machine-level or user-level tooling/);
  assert.match(start, /Starts or repeats authentication/);
  assert.match(start, /Creates or attaches an Apps Script project/);
  assert.match(start, /publishes\/deploys a web app/);
  assert.match(start, /Safe local remediation such as `npm install`/);
});

test('doctor --ci is ready on latest Node/npm, or tells you to nvm install node', () => {
  const ran = spawnSync(process.execPath, ['scripts/doctor.mjs', '--ci'], { encoding: 'utf8' });
  if (ran.status === 0) {
    assert.match(ran.stdout, /Develop: ready/);
    return;
  }
  assert.match(ran.stdout, /nvm install node/, ran.stdout + ran.stderr);
  assert.match(ran.stdout, /Develop: not ready/);
});
