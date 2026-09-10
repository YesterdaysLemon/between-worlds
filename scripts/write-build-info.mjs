import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

let sha = 'local';
try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
if (process.argv.includes('--require-sha') && !/^[a-f0-9]{40}$/.test(sha)) throw new Error('A committed source checkout is required for a release image.');
const html = readFileSync('dist/index.html', 'utf8');
const assets = readdirSync('dist/assets').filter(name => /\.(js|css)$/.test(name)).map(name => `/assets/${name}`).sort();
if (!html.includes('Between worlds') || !assets.some(name => name.includes('worker-')) || !assets.some(name => name.endsWith('.css'))) throw new Error('Incomplete application build.');
writeFileSync('dist/build.json', JSON.stringify({ ok: true, app: 'between-worlds', sha, assets }, null, 2) + '\n');
console.log(`Build identity: ${sha}`);
