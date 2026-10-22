import type { SpendRequest, RoleSlot, Vote } from '../types/contract.ts';

export type ApiErrorCode = 401 | 403 | 404 | 409 | 422 | 503 | 'network';
export type ApiFailure = { ok: false; code: ApiErrorCode; message: string };
export type ApiResult<T> = { ok: true; data: T } | ApiFailure;
export type Me = { sub: string; displayName: string; roles: string[] };
type NewRequest = Pick<SpendRequest, 'title' | 'amountMinor' | 'currency' | 'category' | 'businessReason'>;
type NewDecision = { roleSlot: RoleSlot; vote: Vote; comment?: string };

export function createSpendApi(getToken: () => Promise<string | null>) {
  async function request<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    try {
      const token = await getToken();
      if (!token) return { ok: false, code: 401, message: 'Sign in again to continue.' };
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'omit', cache: 'no-store',
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      if (response.ok) return { ok: true, data: data as T };
      const code = [401, 403, 404, 409, 422, 503].includes(response.status) ? response.status as ApiErrorCode : 'network';
      return { ok: false, code, message: typeof data?.error === 'string' ? data.error : 'The request could not be completed.' };
    } catch {
      return { ok: false, code: 'network', message: 'Could not complete the request. Check your connection and retry.' };
    }
  }
  return {
    getMe: () => request<Me>('/api/me'),
    listRequests: () => request<SpendRequest[]>('/api/requests'),
    getRequest: (id: string) => request<SpendRequest>(`/api/requests/${encodeURIComponent(id)}`),
    createRequest: (body: NewRequest) => request<SpendRequest>('/api/requests', body),
    submitDecision: (id: string, body: NewDecision) => request<{ status: SpendRequest['status']; request: SpendRequest }>(`/api/requests/${encodeURIComponent(id)}/decisions`, body),
  };
}
