import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PLACEHOLDER_SCRIPT_ID = 'REPLACE_WITH_APPS_SCRIPT_ID';
export const APPS_SCRIPT_API_SETTINGS = 'https://script.google.com/home/usersettings';
export const LATEST_NODE_ALIASES = ['node', 'latest', 'current'];
export const NPM_DOCTOR_CHECKS = ['connection', 'registry', 'environment', 'versions'];
const LATEST_TOOLCHAIN_FIX = [
  'This project tracks latest Node.js and npm (see .nvmrc), not a pinned major.',
  'nvm install node',
  'nvm install-latest-npm',
  'In GitHub Actions: npm install -g npm@latest after setup-node.',
  'Then re-run: npm run doctor',
].join('\n');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ANSI = {
  reset: '\u001b[0m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m',
  dim: '\u001b[2m',
};

export function parseArgs(argv) {
  const options = { ci: false, fix: false, help: false };
  for (const arg of argv) {
    if (arg === '--ci') options.ci = true;
    else if (arg === '--fix') options.fix = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--') continue;
    else throw new Error(`Unknown argument: ${arg}\n${usage()}`);
  }
  return options;
}

export function usage() {
  return `Usage: node scripts/doctor.mjs [--ci] [--fix]

Checks that this checkout can develop, authenticate with clasp, and reach
the public Hello World page.

  --ci   Toolchain only (Node, npm, git, node_modules). For GitHub Actions.
  --fix  Safe remediations only: npm install, create .secrets/, copy clasp
         credentials into .secrets/. Never logs in or deploys.
`;
}

export function isLatestAlias(spec) {
  return LATEST_NODE_ALIASES.includes(String(spec || '').trim().toLowerCase());
}

export function clasprcLooksValid(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (parsed.tokens && typeof parsed.tokens === 'object' && Object.keys(parsed.tokens).length > 0) return true;
  if (parsed.token && typeof parsed.token === 'object') return true;
  if (parsed.access_token && parsed.refresh_token) return true;
  return false;
}

export function isPlaceholderScriptId(id) {
  if (!id || typeof id !== 'string') return true;
  const trimmed = id.trim();
  return trimmed.length === 0 || /replace/i.test(trimmed) || trimmed === PLACEHOLDER_SCRIPT_ID;
}

export function parseNpmDoctorOutput(text) {
  const lines = String(text || '').split(/\r?\n/);
  const failures = [];
  const recommendations = [];
  let current = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Checking |^Connecting /i.test(line)) current = trimmed;
    if (/^Not ok$/i.test(trimmed)) failures.push(current || 'npm doctor check');
    if (/^Use (node|npm) /i.test(trimmed)) recommendations.push(trimmed);
  }
  return { ok: failures.length === 0, failures, recommendations };
}

export function extractJsonValue(text) {
  const raw = String(text || '');
  const bracket = raw.indexOf('[');
  const brace = raw.indexOf('{');
  const candidates = [bracket, brace].filter((index) => index >= 0);
  if (!candidates.length) throw new Error('No JSON found in clasp output');
  return JSON.parse(raw.slice(Math.min(...candidates)));
}

export function versionedDeploymentIds(deployments) {
  const list = Array.isArray(deployments) ? deployments : [];
  return list
    .filter((row) => row && row.deploymentId && row.versionNumber)
    .map((row) => row.deploymentId);
}

export function webAppExecUrl(deploymentId) {
  return `https://script.google.com/macros/s/${deploymentId}/exec`;
}

export function classifyPublicResponse({ status, location = '', body = '' }) {
  const loc = String(location);
  const text = String(body);
  if (/accounts\.google\.com|ServiceLogin/i.test(loc) || /accounts\.google\.com|ServiceLogin/i.test(text)) {
    return { ok: false, reason: 'redirects to Google sign-in; set Who has access to Anyone' };
  }
  if (status === 401 || status === 403) {
    return { ok: false, reason: `HTTP ${status}; set Who has access to Anyone` };
  }
  if (status >= 300 && status < 400) {
    return { ok: false, reason: `unexpected redirect (${status})` };
  }
  if (status === 200 && /Hello, world!/i.test(text)) {
    return { ok: true, reason: 'HTTP 200 with Hello, world!' };
  }
  if (status === 200) {
    return { ok: false, reason: 'HTTP 200 but Hello, world! was not in the response' };
  }
  return { ok: false, reason: `HTTP ${status || 'no response'}` };
}

export function clasprcRemediation({ homeExists = false, rootExists = false } = {}) {
  const found = [];
  if (homeExists) found.push(`Found credentials at ~/.clasprc.json. Copy them with: npm run doctor -- --fix`);
  if (rootExists) found.push(`Found credentials at ./.clasprc.json. Move them with: npm run doctor -- --fix`);
  return [
    ...found,
    `Enable the Apps Script API: ${APPS_SCRIPT_API_SETTINGS}`,
    'mkdir -p .secrets',
    'npx clasp login --auth .secrets/.clasprc.json',
    'If login wrote ~/.clasprc.json instead: mkdir -p .secrets && mv ~/.clasprc.json .secrets/.clasprc.json',
  ].join('\n');
}

export function claspJsonRemediation() {
  return [
    'Copy the example and set the real script ID:',
    'cp .clasp.json.example .clasp.json',
    'Or create a project after clasp login:',
    'clasp_config_auth=.secrets/.clasprc.json npx clasp create --title "nohost Web App" --type webapp --rootDir dist',
  ].join('\n');
}

export function publicHelloWorldRemediation() {
  return [
    'Build, push, and create/update a versioned web-app deployment:',
    'npm run deploy',
    'In Apps Script (npx clasp open): Deploy → Manage deployments → edit the web app.',
    'Set Execute as: Me, Who has access: Anyone, then Deploy.',
    'Re-run: npm run doctor',
  ].join('\n');
}

function result(status, id, group, message, fix) {
  return { status, id, group, message, fix };
}

export function createIo(overrides = {}) {
  return {
    root: ROOT,
    env: process.env,
    nodeVersion: process.version,
    homedir: homedir(),
    exists: (path) => existsSync(path),
    read: (path) => readFileSync(path, 'utf8'),
    mkdir: (path) => mkdirSync(path, { recursive: true }),
    copy: (from, to) => copyFileSync(from, to),
    spawn: (command, args, options) => spawnSync(command, args, options),
    fetch: (url, options) => fetch(url, options),
    log: (...args) => console.log(...args),
    ...overrides,
  };
}

function spawnText(io, command, args, extra = {}) {
  const ran = io.spawn(command, args, {
    encoding: 'utf8',
    cwd: io.root,
    timeout: extra.timeout ?? 20_000,
    env: extra.env ?? io.env,
  });
  return {
    status: ran.status,
    error: ran.error,
    stdout: ran.stdout || '',
    stderr: ran.stderr || '',
    output: `${ran.stdout || ''}${ran.stderr || ''}`,
  };
}

function readJsonIfPresent(io, path) {
  if (!io.exists(path)) return { exists: false };
  try {
    return { exists: true, value: JSON.parse(io.read(path)) };
  } catch (error) {
    return { exists: true, error: error.message };
  }
}

export function applyFixes(io) {
  const actions = [];
  const nodeModules = join(io.root, 'node_modules');
  const secretsDir = join(io.root, '.secrets');
  const projectClasprc = join(secretsDir, '.clasprc.json');
  const homeClasprc = join(io.homedir, '.clasprc.json');
  const rootClasprc = join(io.root, '.clasprc.json');

  if (!io.exists(nodeModules)) {
    const install = spawnText(io, 'npm', ['install'], { timeout: 120_000 });
    if (install.error || install.status !== 0) {
      throw new Error(`npm install failed:\n${install.output || install.error?.message || ''}`.trim());
    }
    actions.push('ran npm install');
  }

  if (!io.exists(secretsDir)) {
    io.mkdir(secretsDir);
    actions.push('created .secrets/');
  }

  if (!io.exists(projectClasprc)) {
    if (io.exists(rootClasprc)) {
      io.copy(rootClasprc, projectClasprc);
      actions.push('copied ./.clasprc.json to .secrets/.clasprc.json');
    } else if (io.exists(homeClasprc)) {
      io.copy(homeClasprc, projectClasprc);
      actions.push('copied ~/.clasprc.json to .secrets/.clasprc.json');
    }
  }

  return actions;
}

function checkNode(io) {
  if (!io.nodeVersion) {
    return result('fail', 'node', 'develop', 'Could not read the Node.js version.', LATEST_TOOLCHAIN_FIX);
  }
  return result('pass', 'node', 'develop', `Node.js ${io.nodeVersion}`);
}

function checkNpm(io) {
  const ran = spawnText(io, 'npm', ['-v']);
  if (ran.error || ran.status !== 0) {
    return result('fail', 'npm', 'develop', 'npm is not available.', LATEST_TOOLCHAIN_FIX);
  }
  return result('pass', 'npm', 'develop', `npm ${ran.stdout.trim()}`);
}

function checkGit(io) {
  const ran = spawnText(io, 'git', ['--version']);
  if (ran.error?.code === 'ENOENT' || ran.status !== 0) {
    return result(
      'fail',
      'git',
      'develop',
      'git is not installed or not on PATH.',
      'Install Git from https://git-scm.com/ and re-run npm run doctor. The session startup git commands will fail until this is fixed.',
    );
  }
  const inside = spawnText(io, 'git', ['rev-parse', '--is-inside-work-tree']);
  const branch = spawnText(io, 'git', ['branch', '--show-current']);
  const version = ran.stdout.trim();
  if (inside.stdout.trim() !== 'true') {
    return result('warn', 'git', 'develop', `${version}, but this directory is not a git work tree.`);
  }
  const name = branch.stdout.trim() || '(detached)';
  return result('pass', 'git', 'develop', `${version}; branch ${name}`);
}

function npmDoctorFix(parsed) {
  const versionFail = parsed.failures.some((name) => /node version|npm version/i.test(name));
  const otherFail = parsed.failures.some((name) => !/node version|npm version/i.test(name));
  const lines = [];
  if (versionFail) {
    lines.push(LATEST_TOOLCHAIN_FIX);
    if (parsed.recommendations.length) lines.push(parsed.recommendations.join('\n'));
  }
  if (otherFail) {
    lines.push('Confirm git is installed, https://registry.npmjs.org/ is reachable, and your npm global bin directory is on PATH.');
  }
  return lines.join('\n');
}

function checkNpmDoctor(io) {
  const ran = spawnText(io, 'npm', ['doctor', ...NPM_DOCTOR_CHECKS], { timeout: 30_000 });
  if (ran.error?.code === 'ENOENT') {
    return result('fail', 'npm-doctor', 'develop', 'npm doctor could not run because npm is missing.', LATEST_TOOLCHAIN_FIX);
  }
  const parsed = parseNpmDoctorOutput(ran.output);
  if (ran.error || ran.status !== 0 || !parsed.ok) {
    const detail = parsed.failures.length ? parsed.failures.join('; ') : ran.output.trim() || ran.error?.message || 'unknown failure';
    return result('fail', 'npm-doctor', 'develop', `npm doctor ${NPM_DOCTOR_CHECKS.join('/')} failed (${detail}).`, npmDoctorFix(parsed) || LATEST_TOOLCHAIN_FIX);
  }
  return result('pass', 'npm-doctor', 'develop', `npm doctor ${NPM_DOCTOR_CHECKS.join(', ')} are healthy`);
}

function checkNvmrc(io) {
  const nvmrc = join(io.root, '.nvmrc');
  if (!io.exists(nvmrc)) {
    return result('fail', 'nvmrc', 'develop', 'Missing .nvmrc latest alias.', 'Add a .nvmrc file containing: node');
  }
  let spec = '';
  try {
    spec = io.read(nvmrc).trim();
  } catch (error) {
    return result('fail', 'nvmrc', 'develop', `Could not read .nvmrc (${error.message}).`, 'Add a .nvmrc file containing: node');
  }
  if (!isLatestAlias(spec)) {
    return result('fail', 'nvmrc', 'develop', `.nvmrc is "${spec}"; this project tracks latest, not a pinned version.`, 'Set .nvmrc to: node');
  }
  return result('pass', 'nvmrc', 'develop', `.nvmrc uses the latest alias (${spec})`);
}

function checkNodeModules(io) {
  const dir = join(io.root, 'node_modules');
  const required = ['@google/clasp', 'typescript'].map((name) => join(dir, ...name.split('/')));
  if (!io.exists(dir)) {
    return result('fail', 'node-modules', 'develop', 'node_modules is missing.', 'Run npm install, or npm run doctor -- --fix, then re-run npm run doctor.');
  }
  const missing = required.filter((path) => !io.exists(path)).map((path) => path.slice(io.root.length + 1));
  if (missing.length) {
    return result('fail', 'node-modules', 'develop', `node_modules is incomplete (missing ${missing.join(', ')}).`, 'Run npm install, then re-run npm run doctor.');
  }
  return result('pass', 'node-modules', 'develop', 'node_modules includes clasp and TypeScript');
}

function checkSpecKit(io) {
  const ran = spawnText(io, 'specify', ['--version']);
  if (ran.error?.code === 'ENOENT' || ran.status !== 0) {
    return result(
      'warn',
      'speckit',
      'develop',
      'SpecKit (`specify`) was not found.',
      'AI sessions still need SpecKit. Install with: uv tool install specify-cli --from git+https://github.com/github/spec-kit.git',
    );
  }
  return result('pass', 'speckit', 'develop', `SpecKit ${ran.stdout.trim() || ran.stderr.trim() || 'available'}`);
}

function checkClasprc(io) {
  const project = readJsonIfPresent(io, join(io.root, '.secrets', '.clasprc.json'));
  const homeExists = io.exists(join(io.homedir, '.clasprc.json'));
  const rootExists = io.exists(join(io.root, '.clasprc.json'));
  const fix = clasprcRemediation({ homeExists, rootExists });

  if (!project.exists) {
    return result('fail', 'clasprc', 'deploy', 'Missing clasp credentials at .secrets/.clasprc.json.', fix);
  }
  if (project.error) {
    return result('fail', 'clasprc', 'deploy', `Invalid JSON in .secrets/.clasprc.json (${project.error}).`, 'Re-run clasp login and replace .secrets/.clasprc.json. Do not commit this file.');
  }
  if (!clasprcLooksValid(project.value)) {
    return result('fail', 'clasprc', 'deploy', '.secrets/.clasprc.json does not look like clasp OAuth credentials.', fix);
  }
  return result('pass', 'clasprc', 'deploy', 'Clasp credentials are present in .secrets/.clasprc.json');
}

function checkClaspJson(io) {
  const example = join(io.root, '.clasp.json.example');
  const claspJson = join(io.root, '.clasp.json');
  if (!io.exists(example)) {
    return result('fail', 'clasp-json', 'deploy', 'Missing .clasp.json.example in the repository.', 'Restore .clasp.json.example from source control.');
  }
  const file = readJsonIfPresent(io, claspJson);
  if (!file.exists) {
    return result('fail', 'clasp-json', 'deploy', 'Missing .clasp.json (only .clasp.json.example is in git).', claspJsonRemediation());
  }
  if (file.error) {
    return result('fail', 'clasp-json', 'deploy', `Invalid JSON in .clasp.json (${file.error}).`, claspJsonRemediation());
  }
  if (isPlaceholderScriptId(file.value?.scriptId)) {
    return result('fail', 'clasp-json', 'deploy', '`.clasp.json` still has a placeholder script ID.', claspJsonRemediation());
  }
  const rootDir = file.value?.rootDir;
  if (rootDir && rootDir !== 'dist') {
    return result('warn', 'clasp-json', 'deploy', `.clasp.json rootDir is "${rootDir}" (expected dist).`);
  }
  return result('pass', 'clasp-json', 'deploy', `Clasp project scriptId is set; rootDir=${rootDir || '(default)'}`);
}

function claspEnv(io) {
  return { ...io.env, clasp_config_auth: join(io.root, '.secrets', '.clasprc.json') };
}

function checkClaspStatus(io, previous) {
  if (previous.some((row) => row.id === 'node-modules' && row.status === 'fail')) {
    return result('skip', 'clasp-status', 'deploy', 'Skipped clasp status because node_modules is not ready.');
  }
  if (previous.some((row) => (row.id === 'clasprc' || row.id === 'clasp-json') && row.status === 'fail')) {
    return result('skip', 'clasp-status', 'deploy', 'Skipped clasp status until credentials and .clasp.json are configured.');
  }
  const ran = spawnText(io, 'npx', ['clasp', 'status'], { env: claspEnv(io), timeout: 45_000 });
  if (ran.error || ran.status !== 0) {
    return result(
      'fail',
      'clasp-status',
      'deploy',
      `clasp status failed (${(ran.stderr || ran.stdout || ran.error?.message || 'unknown error').trim().split('\n')[0]}).`,
      `${clasprcRemediation()}\nThen re-run: clasp_config_auth=.secrets/.clasprc.json npx clasp status`,
    );
  }
  return result('pass', 'clasp-status', 'deploy', 'clasp status reached the Apps Script project');
}

async function fetchPublicPage(io, url) {
  let current = url;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await io.fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    const location = typeof response.headers?.get === 'function' ? response.headers.get('location') || '' : '';
    if (response.status >= 300 && response.status < 400 && location) {
      if (/accounts\.google\.com/i.test(location)) {
        return { status: response.status, location, body: '' };
      }
      current = new URL(location, current).href;
      continue;
    }
    const body = typeof response.text === 'function' ? await response.text() : '';
    return { status: response.status, location, body };
  }
  return { status: 0, location: current, body: '' };
}

async function checkPublicHelloWorld(io, previous) {
  const configuredUrl = io.env.CLASP_WEB_APP_URL;
  let url = configuredUrl;
  if (!url) {
    if (previous.some((row) => ['clasprc', 'clasp-json', 'clasp-status', 'node-modules'].includes(row.id) && (row.status === 'fail' || row.status === 'skip'))) {
      return result('skip', 'public-hello-world', 'public', 'Skipped public Hello World check until clasp is configured.');
    }
    const ran = spawnText(io, 'npx', ['clasp', 'list-deployments', '--json'], { env: claspEnv(io), timeout: 45_000 });
    if (ran.error || ran.status !== 0) {
      return result('fail', 'public-hello-world', 'public', 'Could not list clasp deployments to find a public URL.', publicHelloWorldRemediation());
    }
    let deployments;
    try {
      deployments = extractJsonValue(ran.stdout);
    } catch {
      return result('fail', 'public-hello-world', 'public', 'clasp list-deployments --json did not return JSON.', publicHelloWorldRemediation());
    }
    const ids = versionedDeploymentIds(deployments);
    if (!ids.length) {
      return result('fail', 'public-hello-world', 'public', 'No versioned web-app deployment exists yet.', publicHelloWorldRemediation());
    }
    url = webAppExecUrl(ids[0]);
  }

  let page;
  try {
    page = await fetchPublicPage(io, url);
  } catch (error) {
    return result('fail', 'public-hello-world', 'public', `Could not fetch ${url} (${error.message}).`, publicHelloWorldRemediation());
  }
  const verdict = classifyPublicResponse(page);
  if (!verdict.ok) {
    return result('fail', 'public-hello-world', 'public', `${url} is not anonymously serving Hello World (${verdict.reason}).`, publicHelloWorldRemediation());
  }
  return result('pass', 'public-hello-world', 'public', `${url} — ${verdict.reason}`);
}

export async function runChecks(options = {}, io = createIo()) {
  const results = [];

  results.push(checkNode(io));
  results.push(checkNpm(io));
  results.push(checkGit(io));
  results.push(checkNvmrc(io));
  results.push(checkNpmDoctor(io));
  results.push(checkNodeModules(io));
  if (!options.ci) results.push(checkSpecKit(io));
  if (!options.ci) {
    results.push(checkClasprc(io));
    results.push(checkClaspJson(io));
    results.push(checkClaspStatus(io, results));
    results.push(await checkPublicHelloWorld(io, results));
  }
  return results;
}

export function summarize(results) {
  const failed = results.filter((row) => row.status === 'fail');
  const developReady = !failed.some((row) => row.group === 'develop');
  const deployRows = results.filter((row) => row.group === 'deploy');
  const deployReady = deployRows.length ? developReady && !failed.some((row) => row.group === 'deploy') : null;
  const publicRow = results.find((row) => row.id === 'public-hello-world');
  let publicHelloWorld = 'unchecked';
  if (publicRow?.status === 'pass') publicHelloWorld = 'visible';
  else if (publicRow?.status === 'fail') publicHelloWorld = 'not visible';
  return {
    ok: failed.length === 0,
    developReady,
    deployReady,
    publicHelloWorld,
    failed,
  };
}

function paint(enabled, color, text) {
  if (!enabled) return text;
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

export function formatReport(results, { color = false, actions = [] } = {}) {
  const labels = {
    pass: paint(color, 'green', '[PASS]'),
    fail: paint(color, 'red', '[FAIL]'),
    warn: paint(color, 'yellow', '[WARN]'),
    skip: paint(color, 'cyan', '[SKIP]'),
  };
  const lines = ['nohost doctor', ''];
  if (actions.length) {
    lines.push(`Applied --fix: ${actions.join('; ')}`, '');
  }
  for (const row of results) {
    lines.push(`${labels[row.status]} ${row.message}`);
    if (row.fix) {
      for (const fixLine of row.fix.split('\n')) lines.push(`       ${fixLine}`);
    }
  }
  lines.push('');
  const summary = summarize(results);
  lines.push(`Develop: ${summary.developReady ? 'ready' : 'not ready'}`);
  lines.push(`Deploy:  ${summary.deployReady === true ? 'ready' : summary.deployReady === false ? 'not ready' : 'unchecked'}`);
  lines.push(`Public Hello World: ${summary.publicHelloWorld}`);
  lines.push('');
  if (summary.ok) {
    if (summary.publicHelloWorld === 'visible') {
      lines.push('Doctor passed. This checkout can develop and the public Hello World page is reachable.');
    } else {
      lines.push('Doctor passed the checks that were run.');
    }
  } else {
    lines.push('Doctor failed. Resolve the fixes above, then re-run: npm run doctor');
    if (!summary.developReady) {
      lines.push('Halt feature work until develop checks pass (latest Node/npm, git, npm install).');
    } else {
      lines.push('Local build/test can continue, but do not claim the Hello World page is public until deploy checks pass.');
    }
  }
  return lines.join('\n');
}

export async function main(argv, io = createIo()) {
  const options = parseArgs(argv);
  if (options.help) {
    io.log(usage());
    return 0;
  }
  let actions = [];
  if (options.fix) {
    actions = applyFixes(io);
  }
  const results = await runChecks(options, io);
  const color = Boolean(process.stdout.isTTY) && !options.ci && !io.env.CI;
  io.log(formatReport(results, { color, actions }));
  return summarize(results).ok ? 0 : 1;
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(resolve(entry)).href === import.meta.url;
}

if (invokedDirectly()) {
  const code = await main(process.argv.slice(2));
  process.exit(code);
}
