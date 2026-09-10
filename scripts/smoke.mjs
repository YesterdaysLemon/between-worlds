import assert from 'node:assert/strict';

const base = process.argv[2];
const expected = process.argv[3];
assert(base && expected, 'Usage: node scripts/smoke.mjs BASE_URL EXPECTED_SHA');
const get = path => fetch(new URL(path, base), { signal: AbortSignal.timeout(15000), redirect: 'error' });
const health = await get('/healthz');
assert.equal(health.status, 200);
assert.match(health.headers.get('content-type'), /application\/json/);
assert.match(health.headers.get('cache-control'), /no-store/);
const info = await health.json();
assert.equal(info.app, 'between-worlds');
assert.equal(info.sha, expected);
assert(info.ok && info.assets.length >= 3);
const index = await get('/?experiment=cascade');
assert.equal(index.status, 200);
assert.match(await index.text(), /Between worlds/);
for (const asset of [...info.assets, '/favicon.svg']) {
  const response = await get(asset);
  assert.equal(response.status, 200, asset);
  assert.match(response.headers.get('content-type'), asset.endsWith('.css') ? /text\/css/ : asset.endsWith('.svg') ? /image\/svg\+xml/ : /javascript/, asset);
  assert((await response.arrayBuffer()).byteLength > 50, asset);
}
assert.equal((await get('/assets/missing-file.js')).status, 404);
assert.equal((await get('/src/core.mjs')).status, 404);
console.log(JSON.stringify({ ok: true, base, sha: info.sha, assets: info.assets.length + 1 }));
