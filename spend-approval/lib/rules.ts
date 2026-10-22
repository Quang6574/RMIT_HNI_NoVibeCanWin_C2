import type { Decision, RoleSlot, SpendRequest, Vote } from '../types/contract.ts';

export type Actor = { sub: string; displayName: string; roles: string[] };
export type CreateRequestInput = Pick<SpendRequest, 'title' | 'amountMinor' | 'currency' | 'category' | 'businessReason'>;
export type DecisionInput = { roleSlot: RoleSlot; vote: Vote; comment?: string };
export const slotRoles: Record<RoleSlot, string> = {
  senior_a: 'spend_senior_reviewer', senior_b: 'spend_senior_reviewer', ceo: 'spend_ceo_reviewer',
};
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) {
    throw new HttpError(422, 'Invalid input shape or unknown field.');
  }
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpError(422, `${field} must contain 1–${max} characters.`);
  return value.trim();
}
export function parseRequest(value: unknown): CreateRequestInput {
  const data = object(value, ['title', 'amountMinor', 'currency', 'category', 'businessReason']);
  if (!Number.isSafeInteger(data.amountMinor) || (data.amountMinor as number) <= 0 || (data.amountMinor as number) > 100000000) {
    throw new HttpError(422, 'Amount must be 1–100,000,000 integer USD cents.');
  }
  if (data.currency !== 'USD') throw new HttpError(422, 'This prototype supports USD only.');
  return { title: text(data.title, 'Title', 120), amountMinor: data.amountMinor as number, currency: 'USD', category: text(data.category, 'Category', 60), businessReason: text(data.businessReason, 'Business reason', 500) };
}
export function parseDecision(value: unknown): DecisionInput {
  const data = object(value, ['roleSlot', 'vote', 'comment']);
  if (typeof data.roleSlot !== 'string' || !Object.hasOwn(slotRoles, data.roleSlot)) throw new HttpError(422, 'Unknown reviewer slot.');
  if (data.vote !== 'approve' && data.vote !== 'reject') throw new HttpError(422, 'Vote must be approve or reject.');
  if (data.comment !== undefined && (typeof data.comment !== 'string' || data.comment.length > 200)) throw new HttpError(422, 'Comment must be at most 200 characters.');
  return { roleSlot: data.roleSlot as RoleSlot, vote: data.vote, ...(typeof data.comment === 'string' && data.comment.trim() ? { comment: data.comment.trim() } : {}) };
}
export function validateReviewers(reviewers: Record<RoleSlot, string>) {
  const subjects = Object.values(reviewers);
  if (subjects.length !== 3 || subjects.some(sub => !sub || sub.length > 255 || sub !== sub.trim()) || new Set(subjects).size !== 3) {
    throw new HttpError(503, 'Three distinct reviewer subjects must be configured by the operator.');
  }
}
export function canView(request: SpendRequest, actor: Actor): boolean {
  return request.requesterSub === actor.sub || (Object.keys(slotRoles) as RoleSlot[]).some(slot => request.assignedReviewers[slot] === actor.sub && actor.roles.includes(slotRoles[slot]));
}
export function applyDecision(request: SpendRequest, actor: Actor, input: DecisionInput): SpendRequest {
  if (request.requesterSub === actor.sub) throw new HttpError(403, 'A requester cannot review their own request.');
  if (request.assignedReviewers[input.roleSlot] !== actor.sub || !actor.roles.includes(slotRoles[input.roleSlot])) throw new HttpError(403, 'The assigned identity and verified reviewer role are both required.');
  if (request.status !== 'pending') throw new HttpError(409, 'This request is already final.');
  if (request.decisions.some(decision => decision.reviewerSub === actor.sub || decision.roleSlot === input.roleSlot)) throw new HttpError(409, 'This reviewer has already voted.');
  const decision: Decision = { ...input, requestId: request.id, reviewerSub: actor.sub, decidedAt: new Date().toISOString() };
  const decisions = [...request.decisions, decision];
  const status = input.vote === 'reject' ? 'denied' : (Object.keys(slotRoles) as RoleSlot[]).every(slot => decisions.some(item => item.roleSlot === slot && item.reviewerSub === request.assignedReviewers[slot] && item.vote === 'approve')) ? 'approved' : 'pending';
  return { ...request, decisions, status };
}
