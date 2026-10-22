import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDecision, parseRequest, parseDecision, canView, validateReviewers } from '../lib/rules.ts';
import type { RoleSlot } from '../types/contract.ts';
import { reviewers, staff, actors, input, pending } from './fixtures.ts';
function expectStatus(status: number) { return (error: unknown) => error instanceof Error && 'status' in error && error.status === status; }

test('zero, one and two approvals stay pending; exactly three distinct approvals approve', () => {
  let request = pending();
  assert.equal(request.status, 'pending');
  for (const [index, slot] of (['senior_a', 'senior_b', 'ceo'] as RoleSlot[]).entries()) {
    request = applyDecision(request, actors[slot], { roleSlot: slot, vote: 'approve' });
    assert.equal(request.status, index === 2 ? 'approved' : 'pending');
  }
  assert.equal(request.decisions.length, 3);
});
for (const slot of ['senior_a', 'senior_b', 'ceo'] as RoleSlot[]) {
  test(`rejection by ${slot} denies immediately and blocks every later vote`, () => {
    const denied = applyDecision(pending(), actors[slot], { roleSlot: slot, vote: 'reject' });
    assert.equal(denied.status, 'denied');
    for (const next of ['senior_a', 'senior_b', 'ceo'] as RoleSlot[]) {
      assert.throws(() => applyDecision(denied, actors[next], { roleSlot: next, vote: 'approve' }), expectStatus(409));
    }
  });
}
test('rejection after two approvals is terminal', () => {
  let request = applyDecision(pending(), actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' });
  request = applyDecision(request, actors.senior_b, { roleSlot: 'senior_b', vote: 'approve' });
  request = applyDecision(request, actors.ceo, { roleSlot: 'ceo', vote: 'reject' });
  assert.equal(request.status, 'denied');
  assert.throws(() => applyDecision(request, actors.ceo, { roleSlot: 'ceo', vote: 'approve' }), expectStatus(409));
});
test('duplicate, self-review, unassigned identity, missing role and wrong slot are denied', () => {
  const request = applyDecision(pending(), actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' });
  assert.throws(() => applyDecision(request, actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' }), expectStatus(409));
  const own = { ...pending(), requesterSub: actors.senior_a.sub };
  assert.throws(() => applyDecision(own, actors.senior_a, { roleSlot: 'senior_a', vote: 'approve' }), expectStatus(403));
  for (const actor of [{ ...actors.senior_a, sub: 'impostor' }, { ...actors.senior_a, roles: [] }]) {
    assert.throws(() => applyDecision(pending(), actor, { roleSlot: 'senior_a', vote: 'approve' }), expectStatus(403));
  }
  assert.throws(() => applyDecision(pending(), actors.senior_a, { roleSlot: 'senior_b', vote: 'approve' }), expectStatus(403));
});
test('read scope requires ownership or both assigned identity and current role', () => {
  assert.equal(canView(pending(), staff), true);
  assert.equal(canView(pending(), actors.ceo), true);
  assert.equal(canView(pending(), { ...actors.ceo, roles: [] }), false);
  assert.equal(canView(pending(), { ...staff, sub: 'other-staff' }), false);
});
test('three reviewer identities must be configured and distinct', () => {
  validateReviewers(reviewers);
  assert.throws(() => validateReviewers({ ...reviewers, ceo: reviewers.senior_a }), expectStatus(503));
  assert.throws(() => validateReviewers({ ...reviewers, senior_a: '' }), expectStatus(503));
});
test('input rejects unknown authority fields, invalid money, currency, malformed shapes and long text', () => {
  assert.deepEqual(parseRequest(input), input);
  for (const value of [null, [], { ...input, requesterSub: 'forged' }, { ...input, amountMinor: -1 }, { ...input, amountMinor: 1.5 }, { ...input, amountMinor: 100000001 }, { ...input, currency: 'EUR' }, { ...input, title: 'x'.repeat(121) }]) {
    assert.throws(() => parseRequest(value), expectStatus(422));
  }
  for (const value of [{ roleSlot: 'senior_a', vote: 'yes' }, { roleSlot: 'ceo', vote: 'approve', reviewerSub: 'forged' }, { roleSlot: 'ceo', vote: 'approve', comment: 'x'.repeat(201) }]) {
    assert.throws(() => parseDecision(value), expectStatus(422));
  }
});
