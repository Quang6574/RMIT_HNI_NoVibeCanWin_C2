import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
// Turbopack repeatedly reloads this Windows workspace; use the installed webpack path for a stable demo.
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3001'], {
  cwd: app, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development', SPEND_DEMO_MODE: '1' },
});
child.on('error', error => { console.error('Could not start local simulation:', error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
