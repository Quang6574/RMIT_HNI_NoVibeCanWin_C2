import fixtureData from '../../fixtures/spend-requests.json';
import divergentData from '@/fixtures/divergent-status.json';
import type { Decision, RoleSlot, SpendRequest, Status, Vote } from '@/types/contract';

/**
 * The ONLY module the UI may use to read or write spend data.
 *
 * Two interchangeable adapters sit behind `DATA_SOURCE`:
 *   - `fixtures`: the sandbox adapter, with synthetic data and a fake in-browser server.
 *   - `fetch`:    a correctly shaped client for the real endpoints, not wired to a server.
 *
 * At P1-G3, change the one `DATA_SOURCE` line below to `'fetch'`. No component change is
 * needed. The `fetch` adapter deliberately contains no auth logic; the server verifies
 * the TideCloak token and owns every authorization decision.
 *
 * This sandbox module also exposes a few sandbox-only helpers (`setActingSub`,
 * `listSandboxIdentities`, `resetSandboxData`). They are not part of the frozen API and
 * are removed at port time.
 */

export type DataSource = 'fixtures' | 'fetch';
export const DATA_SOURCE: DataSource = 'fixtures';

export type ApiErrorCode = 401 | 403 | 404 | 409 | 422 | 'network';

export type ApiFailure = {
  ok: false;
  code: ApiErrorCode;
  message: string;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type Me = {
  sub: string;
  displayName: string;
  roles: string[];
};

export type SandboxIdentity = {
  sub: string;
  displayName: string;
};

export type CreateRequestInput = {
  title: string;
  amountMinor: number;
  currency: string;
  category: string;
  businessReason: string;
};

export type SubmitDecisionInput = {
  roleSlot: RoleSlot;
  vote: Vote;
  comment?: string;
};

export type SubmitDecisionResult = {
  status: Status;
  request: SpendRequest;
};

export type SandboxCallOptions = {
  /** Sandbox-only debug switch used by the error-state lab. Never used by screens. */
  forceError?: ApiErrorCode;
};

export interface SpendApi {
  getMe(options?: SandboxCallOptions): Promise<ApiResult<Me>>;
  listRequests(options?: SandboxCallOptions): Promise<ApiResult<SpendRequest[]>>;
  getRequest(id: string, options?: SandboxCallOptions): Promise<ApiResult<SpendRequest>>;
  createRequest(input: CreateRequestInput, options?: SandboxCallOptions): Promise<ApiResult<SpendRequest>>;
  submitDecision(
    requestId: string,
    input: SubmitDecisionInput,
    options?: SandboxCallOptions,
  ): Promise<ApiResult<SubmitDecisionResult>>;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const identityEntries = Object.entries(fixtureData.identities) as Array<
  [string, { displayName: string }]
>;
const sandboxIdentities: SandboxIdentity[] = identityEntries.map(([sub, identity]) => ({
  sub,
  displayName: identity.displayName,
}));

const canonicalRequests = fixtureData.scenarios.map(
  (scenario) => scenario.request,
) as unknown as SpendRequest[];
const divergentRequests = divergentData.requests as unknown as SpendRequest[];

/**
 * The sandbox store is a stand-in for the server database. It is never authoritative for
 * roles or status in the real app; components only render what these functions return.
 */
const initialStore: SpendRequest[] = [...divergentRequests, ...canonicalRequests].map(clone);
let store: SpendRequest[] = initialStore.map(clone);

let actingSub = sandboxIdentities[0]?.sub ?? '';
let nextRequestNumber = 1;

const FORCED_MESSAGES: Record<ApiErrorCode, string> = {
  401: 'Sandbox forced 401: no valid session.',
  403: 'Sandbox forced 403: not permitted.',
  404: 'Sandbox forced 404: not found or not visible.',
  409: 'Sandbox forced 409: duplicate vote or request already final.',
  422: 'Sandbox forced 422: invalid input.',
  network: 'Sandbox forced network failure.',
};

function forced<T>(options?: SandboxCallOptions): ApiResult<T> | null {
  if (!options?.forceError) return null;
  return { ok: false, code: options.forceError, message: FORCED_MESSAGES[options.forceError] };
}

function invalid(message: string): ApiFailure {
  return { ok: false, code: 422, message };
}

function findRequest(id: string): SpendRequest | undefined {
  return store.find((request) => request.id === id);
}

function findIdentity(sub: string): SandboxIdentity | undefined {
  return sandboxIdentities.find((identity) => identity.sub === sub);
}

/**
 * Fake server-side status recomputation for the sandbox store only. The screen never
 * calls this; it only renders the status returned by the API adapter.
 */
function statusFromDecisions(decisions: Decision[]): Status {
  if (decisions.some((decision) => decision.vote === 'reject')) return 'denied';
  const approvedSlots = new Set(
    decisions.filter((decision) => decision.vote === 'approve').map((decision) => decision.roleSlot),
  );
  return approvedSlots.size === 3 ? 'approved' : 'pending';
}

function nextRequestId(): string {
  let id = '';
  do {
    id = `r-ui-${String(nextRequestNumber).padStart(3, '0')}`;
    nextRequestNumber += 1;
  } while (findRequest(id));
  return id;
}

const fixtureApi: SpendApi = {
  async getMe(options) {
    const error = forced<Me>(options);
    if (error) return error;

    const identity = findIdentity(actingSub);
    if (!identity) {
      return { ok: false, code: 401, message: 'No simulated viewer is selected.' };
    }

    const isAssignedReviewer = store.some((request) =>
      Object.values(request.assignedReviewers).includes(identity.sub),
    );

    return {
      ok: true,
      data: {
        sub: identity.sub,
        displayName: identity.displayName,
        // A sandbox label only. It is not a TideCloak role and grants nothing.
        roles: [isAssignedReviewer ? 'sandbox_reviewer' : 'sandbox_requester'],
      },
    };
  },

  async listRequests(options) {
    const error = forced<SpendRequest[]>(options);
    if (error) return error;
    // The sandbox shows every fixture so all states are visible. The real API scopes the
    // list by identity; the UI makes no visibility decision of its own.
    return { ok: true, data: store.map(clone) };
  },

  async getRequest(id, options) {
    const error = forced<SpendRequest>(options);
    if (error) return error;
    const request = findRequest(id);
    if (!request) {
      return { ok: false, code: 404, message: `No request with id ${id} is visible in the sandbox.` };
    }
    return { ok: true, data: clone(request) };
  },

  async createRequest(input, options) {
    const error = forced<SpendRequest>(options);
    if (error) return error;

    const title = input.title.trim();
    const category = input.category.trim();
    const businessReason = input.businessReason.trim();

    if (!title) return invalid('Title is required.');
    if (title.length > 120) return invalid('Title must be 120 characters or fewer.');
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      return invalid('Amount must be a positive integer number of minor units (cents).');
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      return invalid('Currency must be a three-letter code such as USD.');
    }
    if (!category) return invalid('Category is required.');
    if (category.length > 60) return invalid('Category must be 60 characters or fewer.');
    if (!businessReason) return invalid('Business reason is required.');
    if (businessReason.length > 500) {
      return invalid('Business reason must be 500 characters or fewer.');
    }

    const template = canonicalRequests[0]?.assignedReviewers;
    if (!template) return invalid('Sandbox fixture is missing the reviewer assignment template.');

    const request: SpendRequest = {
      id: nextRequestId(),
      title,
      amountMinor: input.amountMinor,
      currency: input.currency,
      category,
      businessReason,
      // The requester is derived from the simulated identity, never from the form.
      requesterSub: actingSub,
      createdAt: new Date().toISOString(),
      assignedReviewers: { ...template },
      decisions: [],
      status: 'pending',
    };

    store = [request, ...store];
    return { ok: true, data: clone(request) };
  },

  async submitDecision(requestId, input, options) {
    const error = forced<SubmitDecisionResult>(options);
    if (error) return error;

    if (!['senior_a', 'senior_b', 'ceo'].includes(input.roleSlot)) {
      return invalid('Unknown reviewer slot.');
    }
    if (!['approve', 'reject'].includes(input.vote)) {
      return invalid('Vote must be approve or reject.');
    }

    const comment = input.comment?.trim();
    if (comment && comment.length > 200) {
      return invalid('Comment must be 200 characters or fewer.');
    }

    const request = findRequest(requestId);
    if (!request) {
      return { ok: false, code: 404, message: `No request with id ${requestId} is visible in the sandbox.` };
    }

    if (request.status !== 'pending') {
      return {
        ok: false,
        code: 409,
        message: `This request is already ${request.status}; it is terminal.`,
      };
    }

    const assignedSub = request.assignedReviewers[input.roleSlot];
    if (assignedSub !== actingSub) {
      if (request.requesterSub === actingSub) {
        return { ok: false, code: 403, message: 'A requester cannot vote on their own request.' };
      }
      return {
        ok: false,
        code: 403,
        message: `The simulated viewer is not the reviewer assigned to ${input.roleSlot}.`,
      };
    }

    const alreadyVoted = request.decisions.some(
      (decision) => decision.roleSlot === input.roleSlot || decision.reviewerSub === actingSub,
    );
    if (alreadyVoted) {
      return {
        ok: false,
        code: 409,
        message: 'This reviewer has already cast one decision on this request.',
      };
    }

    const decision: Decision = {
      requestId,
      reviewerSub: actingSub,
      roleSlot: input.roleSlot,
      vote: input.vote,
      ...(comment ? { comment } : {}),
      decidedAt: new Date().toISOString(),
    };

    request.decisions.push(decision);
    request.status = statusFromDecisions(request.decisions);

    return {
      ok: true,
      data: { status: request.status, request: clone(request) },
    };
  },
};

async function http<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (response.ok) {
      return { ok: true, data: (await response.json()) as T };
    }

    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // Keep the status-based message.
    }

    if ([401, 403, 404, 409, 422].includes(response.status)) {
      return { ok: false, code: response.status as ApiErrorCode, message };
    }

    return { ok: false, code: 'network', message: `Unexpected server response: ${message}` };
  } catch (error) {
    return {
      ok: false,
      code: 'network',
      message: error instanceof Error ? error.message : 'Could not reach the API.',
    };
  }
}

/**
 * Shape-correct client for the real endpoints. It is not wired to a server in this
 * sandbox; the P1-G3 switch flips `DATA_SOURCE` to `'fetch'`.
 */
const fetchApi: SpendApi = {
  getMe: () => http<Me>('/api/me'),
  listRequests: () => http<SpendRequest[]>('/api/requests'),
  getRequest: (id) => http<SpendRequest>(`/api/requests/${encodeURIComponent(id)}`),
  createRequest: (input) =>
    http<SpendRequest>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  submitDecision: (requestId, input) =>
    http<SubmitDecisionResult>(`/api/requests/${encodeURIComponent(requestId)}/decisions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

export const api: SpendApi = DATA_SOURCE === 'fixtures' ? fixtureApi : fetchApi;

// ---------------------------------------------------------------------------
// Sandbox-only helpers. Not part of the frozen API; remove at port time.
// ---------------------------------------------------------------------------

export function listSandboxIdentities(): SandboxIdentity[] {
  return sandboxIdentities.map(clone);
}

export function getActingSub(): string {
  return actingSub;
}

export const ACTING_SUB_EVENT = 'sandbox-viewer-changed';

export function setActingSub(sub: string): boolean {
  if (!findIdentity(sub)) return false;
  actingSub = sub;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ACTING_SUB_EVENT));
  }
  return true;
}

export function resetSandboxData(): void {
  store = initialStore.map(clone);
  nextRequestNumber = 1;
}
