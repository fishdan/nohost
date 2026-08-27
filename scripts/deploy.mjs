import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';

if (existsSync('.secrets/.clasprc.json')) {
  process.env.clasp_config_auth = '.secrets/.clasprc.json';
}

const execFileAsync = promisify(execFile);
const authArgs = process.env.CLASP_USE_ADC === 'true' ? ['--adc'] : [];
const description = `main ${process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString()}`;
const { stdout: versionOutput } = await execFileAsync('npx', ['clasp', ...authArgs, 'version', description]);
const version = versionOutput.match(/(\d+)$/m)?.[1];
if (!version) throw new Error(`Could not determine Apps Script version from clasp output:\n${versionOutput}`);

const deploymentId = process.env.CLASP_DEPLOYMENT_ID;
if (deploymentId) {
  await execFileAsync('npx', ['clasp', ...authArgs, 'redeploy', deploymentId, '--versionNumber', version, '--description', description], { stdio: 'inherit' });
  console.log(`Redeployed ${deploymentId} at version ${version}.`);
} else {
  const { stdout } = await execFileAsync('npx', ['clasp', ...authArgs, 'create-deployment', '--versionNumber', version, '--description', description]);
  console.log(stdout);
  console.warn('CLASP_DEPLOYMENT_ID was not set; a new deployment was created. Save its ID before the next production deploy.');
}
