import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';

if (existsSync('.secrets/.clasprc.json')) {
  process.env.clasp_config_auth = '.secrets/.clasprc.json';
}

const execFileAsync = promisify(execFile);
const authArgs = process.env.CLASP_USE_ADC === 'true' ? ['--adc'] : [];
await execFileAsync('npx', ['clasp', ...authArgs, 'push', '--force'], { stdio: 'inherit' });
