import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  clasprcLooksValid,
  clasprcRemediation,
  classifyPublicResponse,
  createIo,
  extractJsonValue,
  formatReport,
  isLatestAlias,
  isPlaceholderScriptId,
  parseArgs,
  parseNpmDoctorOutput,
  runChecks,
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

test('classifyPublicResponse requires anonymous Hello World HTML', () => {
  assert.equal(classifyPublicResponse({ status: 200, body: '<h1>Hello, world!</h1>' }).ok, true);
  assert.equal(classifyPublicResponse({ status: 302, location: 'https://accounts.google.com/ServiceLogin' }).ok, false);
  assert.equal(classifyPublicResponse({ status: 200, body: '<html>sign in</html>' }).ok, false);
});

test('clasprc remediation tells the user how to login and store credentials', () => {
  const text = clasprcRemediation({ homeExists: true });
  assert.match(text, /clasp login --auth \.secrets\/\.clasprc\.json/);
  assert.match(text, /npm run doctor -- --fix/);
  assert.match(text, /script\.google\.com\/home\/usersettings/);
});

test('fresh clone without clasp credentials fails deploy checks with remediations', async () => {
  const results = await runChecks({}, mockIo());
  const summary = summarize(results);
  assert.equal(summary.developReady, true);
  assert.equal(summary.deployReady, false);
  assert.equal(summary.publicHelloWorld, 'unchecked');
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

test('doctor --ci is ready on latest Node/npm, or tells you to nvm install node', () => {
  const ran = spawnSync(process.execPath, ['scripts/doctor.mjs', '--ci'], { encoding: 'utf8' });
  if (ran.status === 0) {
    assert.match(ran.stdout, /Develop: ready/);
    return;
  }
  assert.match(ran.stdout, /nvm install node/, ran.stdout + ran.stderr);
  assert.match(ran.stdout, /Develop: not ready/);
});
