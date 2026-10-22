import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { SpendStore } from '../lib/store.ts';
import { reviewers, staff, actors, input } from './fixtures.ts';
import type { Actor, DecisionInput } from '../lib/rules.ts';

test('SQLite persists immutable details, votes and audit events across reopening', () => {
  const folder = mkdtempSync(join(tmpdir(), 'spend-persist-'));
  const path = join(folder, 'spend.sqlite');
  let store = new SpendStore(path);
  try {
    const request = store.create(staff, input, reviewers);
    store.decide(request.id, actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' });
    store.close(); store = new SpendStore(path);
    const loaded = store.get(request.id, staff);
    assert.equal(loaded.title, input.title);
    assert.equal(loaded.status, 'pending');
    assert.equal(loaded.decisions.length, 1);
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM audit_events').get()!.n, 2);
    assert.throws(() => store.decide(request.id, actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' }), { status: 409 });
    assert.equal(store.get(request.id, staff).decisions.length, 1);
    assert.throws(() => store.get(request.id, { ...staff, sub: 'outsider' }), { status: 404 });
    assert.throws(() => store.decide(request.id, { ...actors.ceo, sub: 'outsider' }, { roleSlot: 'ceo', vote: 'approve' }), { status: 403 });
    assert.deepEqual(store.list({ ...staff, sub: 'outsider' }), []);
    assert.throws(() => store.create({ ...staff, roles: [] }, input, reviewers), { status: 403 });
    assert.throws(() => store.create({ ...staff, sub: reviewers.ceo }, input, reviewers), { status: 403 });
  } finally { store.close(); rmSync(folder, { recursive: true, force: true }); }
});
test('a failed decision transaction leaves neither a decision nor a changed status', () => {
  const store = new SpendStore(':memory:');
  try {
    const request = store.create(staff, input, reviewers);
    store.db.exec(`CREATE TRIGGER fail_vote_audit BEFORE INSERT ON audit_events WHEN NEW.action='decision.recorded' BEGIN SELECT RAISE(ABORT,'test failure'); END;`);
    assert.throws(() => store.decide(request.id, actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' }));
    assert.equal(store.get(request.id, staff).decisions.length, 0);
    assert.equal(store.get(request.id, staff).status, 'pending');
  } finally { store.close(); }
});
async function race(path: string, id: string, votes: { actor: Actor; input: DecisionInput }[]) {
  const start = new SharedArrayBuffer(4);
  const results = votes.map(vote => new Promise<{ ok: boolean; status: string | number }>((resolve, reject) => {
    let result: { ok: boolean; status: string | number } | undefined;
    const worker = new Worker(new URL('./vote-worker.ts', import.meta.url), { workerData: { path, id, start, ...vote }, execArgv: ['--experimental-strip-types'] });
    worker.on('message', value => { result = value; });
    worker.on('error', reject);
    worker.on('exit', code => { if (code !== 0 || !result) reject(new Error(`Worker exited ${code} without a result`)); else resolve(result); });
  }));
  Atomics.store(new Int32Array(start), 0, 1);
  Atomics.notify(new Int32Array(start), 0);
  return Promise.all(results);
}
test('concurrent database connections cannot duplicate a vote or bypass terminal denial', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'spend-race-'));
  const path = join(folder, 'spend.sqlite');
  const store = new SpendStore(path);
  try {
    const duplicate = store.create(staff, input, reviewers);
    const duplicated = await race(path, duplicate.id, Array.from({ length: 4 }, () => ({ actor: actors.senior_a, input: { roleSlot: 'senior_a', vote: 'approve' } })));
    assert.equal(duplicated.filter(result => result.ok).length, 1);
    assert.equal(duplicated.filter(result => !result.ok && result.status === 409).length, 3);
    assert.equal(store.get(duplicate.id, staff).decisions.length, 1);

    const approved = store.create(staff, input, reviewers);
    await race(path, approved.id, [
      { actor: actors.senior_a, input: { roleSlot: 'senior_a', vote: 'approve' } },
      { actor: actors.senior_b, input: { roleSlot: 'senior_b', vote: 'approve' } },
      { actor: actors.ceo, input: { roleSlot: 'ceo', vote: 'approve' } },
    ]);
    assert.equal(store.get(approved.id, staff).status, 'approved');
    assert.equal(store.get(approved.id, staff).decisions.length, 3);

    const denied = store.create(staff, input, reviewers);
    await race(path, denied.id, [
      { actor: actors.senior_a, input: { roleSlot: 'senior_a', vote: 'approve' } },
      { actor: actors.senior_b, input: { roleSlot: 'senior_b', vote: 'approve' } },
      { actor: actors.ceo, input: { roleSlot: 'ceo', vote: 'reject' } },
    ]);
    assert.equal(store.get(denied.id, staff).status, 'denied');
    assert.throws(() => store.decide(denied.id, actors.ceo, { roleSlot: 'ceo', vote: 'approve' }), { status: 409 });
  } finally { store.close(); rmSync(folder, { recursive: true, force: true }); }
});
