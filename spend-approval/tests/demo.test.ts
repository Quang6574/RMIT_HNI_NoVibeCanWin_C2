import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoActor, demoEnabled } from '../lib/demo.ts';
import { authenticated } from '../lib/http.ts';
import { SpendStore, configuredReviewers, storePath } from '../lib/store.ts';
import { getTideConfig } from '../lib/config.ts';
import { DEMO_IDENTITIES } from '../lib-ui/demo-identities.ts';
import { input } from './fixtures.ts';
import { HttpError, isHttpError } from '../lib/rules.ts';

const saved = { mode: process.env.SPEND_DEMO_MODE, node: process.env.NODE_ENV };
const env: Record<string, string | undefined> = process.env;
after(() => {
  if (saved.mode === undefined) delete process.env.SPEND_DEMO_MODE; else process.env.SPEND_DEMO_MODE = saved.mode;
  if (saved.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = saved.node;
});
function enableDemo() { process.env.SPEND_DEMO_MODE = '1'; env.NODE_ENV = 'development'; }
function request(identity?: string, url = 'http://localhost:3001/api/me', extra: Record<string, string> = {}) {
  return new Request(url, { headers: { ...(identity ? { 'X-Spend-Demo-Identity': identity } : {}), ...extra } });
}

test('HTTP errors remain recognized when a cached store throws across a module reload', async () => {
  enableDemo();
  const reloaded = await import(new URL('../lib/rules.ts?reload=1', import.meta.url).href);
  const conflict = new reloaded.HttpError(409, 'Already decided.');
  assert.equal(conflict instanceof HttpError, false);
  assert.equal(isHttpError(conflict), true);
  assert.equal(isHttpError(Object.assign(new Error('Internal'), { status: 403 })), false);
  assert.equal(isHttpError({ status: 403, message: 'Untrusted input' }), false);
  const response = await authenticated(request('demo-ceo'), () => { throw conflict; });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'Already decided.' });
});

test('simulation is explicit, disabled in production and never authenticates the live API', async () => {
  env.NODE_ENV = 'development';
  for (const flag of ['', 'true', '0']) {
    process.env.SPEND_DEMO_MODE = flag;
    assert.equal(demoEnabled(), false);
    assert.throws(() => demoActor(request('demo-requester')), { status: 401 });
    const response = await authenticated(request('demo-requester'), () => Response.json({ unexpected: true }));
    assert.equal(response.status, 401);
  }
  process.env.SPEND_DEMO_MODE = '1'; env.NODE_ENV = 'production';
  assert.equal(demoEnabled(), false);
  assert.equal((await authenticated(request('demo-ceo'), () => Response.json({ unexpected: true }))).status, 401);
});

test('simulation accepts only four fixed identities at its same-origin loopback address', async () => {
  enableDemo();
  for (const actor of DEMO_IDENTITIES) assert.deepEqual(demoActor(request(actor.sub)), actor);
  for (const denied of [request(), request('luonggiabao420'), request('spend_ceo_reviewer'), request('demo-requester', undefined, { Authorization: 'Bearer fake' })]) {
    assert.throws(() => demoActor(denied), { status: 401 });
  }
  for (const url of ['http://localhost:3000/api/me', 'http://attacker.example:3001/api/me', 'http://192.168.1.2:3001/api/me']) {
    assert.throws(() => demoActor(request('demo-requester', url)), { status: 403 });
  }
  assert.throws(() => demoActor(request('demo-requester', undefined, { Origin: 'https://attacker.example' })), { status: 403 });
  const response = await authenticated(request('demo-requester', undefined, { Origin: 'http://localhost:3001' }), actor => Response.json(actor));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Spend-Mode'), 'simulation');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('demo data and reviewer assignments remain separate from the real workspace', () => {
  enableDemo();
  const demoPath = storePath();
  assert.deepEqual(configuredReviewers(), { senior_a: 'demo-senior-a', senior_b: 'demo-senior-b', ceo: 'demo-ceo' });
  process.env.SPEND_DEMO_MODE = '0';
  assert.notEqual(storePath(), demoPath);
  assert.ok(demoPath.endsWith('spend-demo.sqlite'));
  assert.ok(storePath().endsWith('spend.sqlite'));
  assert.equal(configuredReviewers().ceo, process.env.SPEND_CEO_SUB ?? '');
});

test('simulated actors still obey server roles, fixed assignments, duplicate and terminal rules', () => {
  enableDemo();
  const store = new SpendStore(':memory:');
  try {
    const staff = demoActor(request('demo-requester'));
    const a = demoActor(request('demo-senior-a'));
    const b = demoActor(request('demo-senior-b'));
    const ceo = demoActor(request('demo-ceo'));
    const approved = store.create(staff, input, configuredReviewers());
    assert.throws(() => store.create(a, input, configuredReviewers()), { status: 403 });
    assert.throws(() => store.create(staff, { ...input, requesterSub: ceo.sub }, configuredReviewers()), { status: 422 });
    assert.throws(() => store.decide(approved.id, staff, { roleSlot: 'senior_a', vote: 'approve' }), { status: 403 });
    assert.throws(() => store.decide(approved.id, a, { roleSlot: 'senior_b', vote: 'approve' }), { status: 403 });
    assert.equal(store.decide(approved.id, a, { roleSlot: 'senior_a', vote: 'approve' }).status, 'pending');
    assert.throws(() => store.decide(approved.id, a, { roleSlot: 'senior_a', vote: 'approve' }), { status: 409 });
    assert.equal(store.decide(approved.id, b, { roleSlot: 'senior_b', vote: 'approve' }).status, 'pending');
    assert.equal(store.decide(approved.id, ceo, { roleSlot: 'ceo', vote: 'approve' }).status, 'approved');
    const denied = store.create(staff, input, configuredReviewers());
    assert.equal(store.decide(denied.id, ceo, { roleSlot: 'ceo', vote: 'reject' }).status, 'denied');
    assert.throws(() => store.decide(denied.id, a, { roleSlot: 'senior_a', vote: 'approve' }), { status: 409 });
    assert.equal(store.get(denied.id, staff).decisions.length, 1);
  } finally { store.close(); }
});

test('missing or invalid live config fails closed and simulation can authenticate without it', async () => {
  const original = process.cwd();
  const folder = mkdtempSync(join(tmpdir(), 'spend-config-'));
  try {
    process.chdir(folder);
    assert.throws(getTideConfig, { status: 503 });
    enableDemo();
    assert.equal((await authenticated(request('demo-requester'), actor => Response.json(actor))).status, 200);
    writeFileSync('tidecloak.json', '{}');
    assert.throws(getTideConfig, { status: 503 });
    const config = { realm: 'test', resource: 'client', 'auth-server-url': 'https://issuer.example/' };
    writeFileSync('tidecloak.json', JSON.stringify(config));
    assert.deepEqual(getTideConfig(), config);
  } finally { process.chdir(original); rmSync(folder, { recursive: true, force: true }); }
});
