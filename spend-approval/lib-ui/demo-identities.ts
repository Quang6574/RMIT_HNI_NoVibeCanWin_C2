// Fictional identities for the explicitly enabled local simulation only.
export const DEMO_IDENTITIES = [
  { sub: 'demo-requester', displayName: 'Staff requester', roles: ['spend_requester'] },
  { sub: 'demo-senior-a', displayName: 'Senior reviewer A', roles: ['spend_senior_reviewer'] },
  { sub: 'demo-senior-b', displayName: 'Senior reviewer B', roles: ['spend_senior_reviewer'] },
  { sub: 'demo-ceo', displayName: 'CEO reviewer', roles: ['spend_ceo_reviewer'] },
] as const;
