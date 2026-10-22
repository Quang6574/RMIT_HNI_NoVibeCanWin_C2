import type { Actor } from '../lib/rules.ts';
import type { SpendRequest, RoleSlot } from '../types/contract.ts';
// Synthetic actors for isolated policy tests; never exposed as application authentication.
export const reviewers = { senior_a: 'senior-a', senior_b: 'senior-b', ceo: 'ceo' };
export const staff: Actor = { sub: 'staff', displayName: 'Staff', roles: ['spend_requester'] };
export const actors: Record<RoleSlot, Actor> = {
  senior_a: { sub: reviewers.senior_a, displayName: 'A', roles: ['spend_senior_reviewer'] },
  senior_b: { sub: reviewers.senior_b, displayName: 'B', roles: ['spend_senior_reviewer'] },
  ceo: { sub: reviewers.ceo, displayName: 'CEO', roles: ['spend_ceo_reviewer'] },
};
export const input = { title: 'Fictional equipment', amountMinor: 75000, currency: 'USD', category: 'Equipment', businessReason: 'Synthetic test purchase' };
export function pending(): SpendRequest {
  return { ...input, id: 'test-request', requesterSub: staff.sub, createdAt: new Date().toISOString(), assignedReviewers: { ...reviewers }, decisions: [], status: 'pending' };
}
