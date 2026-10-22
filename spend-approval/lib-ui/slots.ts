import type { Decision, RoleSlot, SpendRequest } from '@/types/contract';

export const ROLE_SLOTS: readonly RoleSlot[] = ['senior_a', 'senior_b', 'ceo'];

export const SLOT_LABELS: Record<RoleSlot, string> = {
  senior_a: 'Senior reviewer A',
  senior_b: 'Senior reviewer B',
  ceo: 'CEO reviewer',
};

export type SlotState = 'pending' | 'approved' | 'rejected';

/**
 * Presentation helper only. A rejection wins if a hostile record contains both votes for
 * one slot; the server would never persist that shape.
 */
export function decisionForSlot(request: SpendRequest, slot: RoleSlot): Decision | undefined {
  const decisions = request.decisions.filter((decision) => decision.roleSlot === slot);
  return (
    decisions.find((decision) => decision.vote === 'reject') ??
    decisions.find((decision) => decision.vote === 'approve')
  );
}

export function slotState(request: SpendRequest, slot: RoleSlot): SlotState {
  const decision = decisionForSlot(request, slot);
  if (!decision) return 'pending';
  return decision.vote === 'reject' ? 'rejected' : 'approved';
}

export function approvedCount(request: SpendRequest): number {
  return ROLE_SLOTS.filter((slot) => decisionForSlot(request, slot)?.vote === 'approve').length;
}

export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date) + ' ICT';
}
