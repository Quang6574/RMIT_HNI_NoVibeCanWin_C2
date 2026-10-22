import type { ApiErrorCode, ApiFailure } from '@/lib-ui/api-client';

const COPY: Record<ApiErrorCode, [string, string]> = {
  401: ['Your session expired', 'Log out and sign in again to continue.'],
  403: ['Not permitted', 'Check that you have the required role and are the assigned reviewer. You cannot review your own request.'],
  404: ['Request not found', 'This request does not exist or is not visible to your account.'],
  409: ['This request has changed', 'You may have already voted, or the request is final. Reload to see its latest status.'],
  422: ['Check your input', 'Review the required fields, amount and length limits, then try again.'],
  503: ['Temporarily unavailable', 'Retry shortly. If this continues, ask the workspace administrator to check the reviewer setup.'],
  network: ['Could not complete the request', 'Check your connection and retry. Before resubmitting a new expense, check the list to avoid creating a duplicate.'],
};

export default function ApiErrorNotice({ error, context }: { error: ApiFailure; context?: string }) {
  const [title, action] = COPY[error.code];
  return <section className="api-error tone-warning" role="alert">
    <div className="api-error-icon" aria-hidden="true">!</div>
    <div className="api-error-body">
      {context ? <p className="kicker">{context}</p> : null}
      <h2>{title}</h2><p>{action}</p>
      {error.message ? <p className="api-error-detail">{error.message}</p> : null}
    </div>
  </section>;
}
