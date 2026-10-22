// Shared contract — Challenge 2 spend approval.
//
// Agreed field-for-field with MASTER-PLAN.md §4. Both apps re-export this contract.
// Types only — no runtime authorization code.

export type RoleSlot = 'senior_a' | 'senior_b' | 'ceo';
export type Vote     = 'approve' | 'reject';
export type Status   = 'pending' | 'approved' | 'denied';

export type SpendRequest = {
  id: string;
  title: string;
  amountMinor: number;        // integer minor units (cents). never a float
  currency: string;           // 'USD' for P0
  category: string;
  businessReason: string;
  requesterSub: string;       // verified TideCloak sub
  createdAt: string;          // ISO 8601
  assignedReviewers: Record<RoleSlot, string>;  // slot -> reviewer sub
  decisions: Decision[];
  status: Status;
};

export type Decision = {
  requestId: string;
  reviewerSub: string;        // verified sub, from token — never from body
  roleSlot: RoleSlot;
  vote: Vote;
  comment?: string;
  decidedAt: string;
};
