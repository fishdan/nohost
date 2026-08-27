import { cp, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await execFileAsync('npx', ['tsc', '--project', 'tsconfig.json']);
await cp('appsscript.json', 'dist/appsscript.json');
await cp('src/client/index.html', 'dist/index.html');
await cp('src/client/styles.html', 'dist/styles.html');
await cp('src/client/scripts.html', 'dist/scripts.html');
console.log('Built Apps Script files in dist/');
