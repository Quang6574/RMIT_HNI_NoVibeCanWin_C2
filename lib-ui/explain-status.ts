import type { Decision, RoleSlot, SpendRequest, Status } from '../contract';

/**
 * Display-only explanation of a spend request.
 *
 * This module NEVER decides a request's status and must never be used to authorize,
 * gate, or mutate anything. The server is the authority; the UI renders the server's
 * status and uses these strings only to explain it in plain language.
 *
 * The explanation is derived from `decisions` and `assignedReviewers`, following the
 * frozen business rule:
 *   - any rejection is terminal and outranks every approval, in any order;
 *   - Approved needs all three distinct slots: senior_a, senior_b and ceo;
 *   - the CEO slot never substitutes for either senior slot.
 *
 * Binding UI rule for P1-G1:
 *   - The status badge always renders `request.status` from the server.
 *   - `derivedStatus` is only a consistency check against the decision log. It is never
 *     the badge value and is never used to authorize anything.
 *   - When `matchesServerStatus` is false, the UI must surface the discrepancy visibly
 *     rather than silently showing either value as if they agreed.
 *
 * Slot labels ("Senior reviewer A", "the CEO reviewer") are presentation only. They are
 * not identity claims; real identities come from verified `sub` claims server-side.
 */

export type StatusExplanation = {
  progress: string;
  explanation: string;
  derivedStatus: Status;
  matchesServerStatus: boolean;
};

const ROLE_SLOTS: readonly RoleSlot[] = ['senior_a', 'senior_b', 'ceo'];

const SLOT_ORDER: Record<RoleSlot, number> = {
  senior_a: 0,
  senior_b: 1,
  ceo: 2,
};

function slotLabel(slot: RoleSlot, atSentenceStart = false): string {
  if (slot === 'ceo') {
    return atSentenceStart ? 'The CEO reviewer' : 'the CEO reviewer';
  }
  const letter = slot === 'senior_a' ? 'A' : 'B';
  return `${atSentenceStart ? 'S' : 's'}enior reviewer ${letter}`;
}

function joinSlots(slots: readonly RoleSlot[], atSentenceStart = false): string {
  const labels = slots.map((slot, index) => slotLabel(slot, atSentenceStart && index === 0));
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function timeOf(decision: Decision): number {
  const parsed = Date.parse(decision.decidedAt);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function sortSlots(slots: readonly RoleSlot[]): RoleSlot[] {
  return [...slots].sort((a, b) => SLOT_ORDER[a] - SLOT_ORDER[b]);
}

function isBothSeniors(slots: readonly RoleSlot[]): boolean {
  return slots.length === 2 && slots.includes('senior_a') && slots.includes('senior_b');
}

function isRoleSlot(value: RoleSlot): boolean {
  return ROLE_SLOTS.includes(value);
}

/**
 * Collapse the decision log to at most one canonical decision per slot.
 *
 * A decision only counts for a slot when it is attributed to the reviewer actually
 * assigned to that slot. This keeps a malformed record from displaying as an approval,
 * without ever treating this function as the authorization gate.
 */
function canonicalDecisions(request: SpendRequest): Decision[] {
  const chosen = new Map<RoleSlot, Decision>();

  for (const decision of request.decisions ?? []) {
    if (!isRoleSlot(decision.roleSlot)) continue;

    const assignedSub = request.assignedReviewers?.[decision.roleSlot];
    if (!assignedSub || assignedSub !== decision.reviewerSub) continue;

    const existing = chosen.get(decision.roleSlot);
    if (!existing) {
      chosen.set(decision.roleSlot, decision);
      continue;
    }

    // A rejection is terminal, so it beats an approval recorded for the same slot.
    if (existing.vote === 'reject' && decision.vote === 'approve') continue;
    if (existing.vote === 'approve' && decision.vote === 'reject') {
      chosen.set(decision.roleSlot, decision);
      continue;
    }

    // Same vote twice: keep the earlier record so the explanation is deterministic.
    if (timeOf(decision) < timeOf(existing)) {
      chosen.set(decision.roleSlot, decision);
    }
  }

  return [...chosen.values()];
}

export function explainStatus(request: SpendRequest): StatusExplanation {
  const decisions = canonicalDecisions(request);
  const approvals = decisions.filter((decision) => decision.vote === 'approve');
  const rejections = decisions.filter((decision) => decision.vote === 'reject');

  const approvedSlots = sortSlots(approvals.map((decision) => decision.roleSlot));
  const outstandingSlots = ROLE_SLOTS.filter(
    (slot) => !decisions.some((decision) => decision.roleSlot === slot),
  );
  const progress = `${approvedSlots.length} of 3 approved`;

  // Consistency check only. The UI badge still renders request.status from the server.
  const derivedStatus: Status =
    rejections.length > 0 ? 'denied' : approvedSlots.length === 3 ? 'approved' : 'pending';
  const matchesServerStatus = derivedStatus === request.status;

  const result = (explanation: string): StatusExplanation => ({
    progress,
    explanation,
    derivedStatus,
    matchesServerStatus,
  });

  // Any rejection wins, regardless of order or timestamp.
  if (rejections.length > 0) {
    const firstRejection = [...rejections].sort(
      (a, b) => timeOf(a) - timeOf(b) || SLOT_ORDER[a.roleSlot] - SLOT_ORDER[b.roleSlot],
    )[0];
    const rejectionTime = timeOf(firstRejection);
    // Inclusive: an approval recorded at the same instant as the rejection is still an
    // approval the progress count shows, so it must be accounted for in the explanation.
    const priorApprovals = approvals.filter((decision) => timeOf(decision) <= rejectionTime);
    const laterApprovals = approvals.filter((decision) => timeOf(decision) > rejectionTime);

    if (laterApprovals.length > 0) {
      const laterSlots = sortSlots(laterApprovals.map((decision) => decision.roleSlot));
      return result(
        `Denied. ${slotLabel(
          firstRejection.roleSlot,
          true,
        )} rejected this request, and that decision is final. Later approvals from ${joinSlots(
          laterSlots,
        )} cannot reverse it.`,
      );
    }

    if (priorApprovals.length > 0) {
      const priorSlots = sortSlots(priorApprovals.map((decision) => decision.roleSlot));
      const priorClause = isBothSeniors(priorSlots)
        ? 'both senior reviewers approved'
        : `${joinSlots(priorSlots)} approved`;
      return result(
        `Denied. ${slotLabel(
          firstRejection.roleSlot,
          true,
        )} rejected this request after ${priorClause}. One rejection is final; later approvals cannot reverse it.`,
      );
    }

    return result(
      `Denied. ${slotLabel(
        firstRejection.roleSlot,
        true,
      )} rejected this request. One rejection is final; later approvals cannot reverse it.`,
    );
  }

  if (approvedSlots.length === 3) {
    return result(
      `Approved. ${joinSlots(ROLE_SLOTS, true)} all approved this request.`,
    );
  }

  if (approvedSlots.length === 0) {
    return result(
      `Pending. No reviewer has voted yet. ${joinSlots(
        ROLE_SLOTS,
        true,
      )} all still need to respond.`,
    );
  }

  const outstandingVerb = outstandingSlots.length === 1 ? 'has' : 'have';

  if (approvedSlots.length === 1) {
    return result(
      `Pending. ${slotLabel(
        approvedSlots[0],
        true,
      )} approved. ${joinSlots(outstandingSlots, true)} ${outstandingVerb} not voted. All three distinct approvals are required.`,
    );
  }

  const approvedClause = isBothSeniors(approvedSlots)
    ? 'Both senior reviewers approved'
    : `${joinSlots(approvedSlots, true)} approved`;

  return result(
    `Pending. ${approvedClause}, but ${joinSlots(
      outstandingSlots,
    )} ${outstandingVerb} not voted. All three distinct approvals are required.`,
  );
}
