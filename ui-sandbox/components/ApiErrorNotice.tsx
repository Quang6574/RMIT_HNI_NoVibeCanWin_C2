import type { ApiErrorCode, ApiFailure } from '@/lib-ui/api-client';

type ErrorCopy = {
  tone: 'warning' | 'neutral' | 'muted' | 'conflict' | 'danger';
  icon: string;
  kicker: string;
  title: string;
  body: string;
  action: string;
};

const COPY: Record<ApiErrorCode, ErrorCopy> = {
  401: {
    tone: 'warning',
    icon: 'key',
    kicker: 'Authentication state',
    title: 'Not signed in',
    body:
      'The API did not receive a valid session. In the integrated app, TideCloak issues and verifies the token; this sandbox has no login at all.',
    action:
      'In the real app, sign-in is the next step. Nothing in this UI grants access, and there is no mock login button here.',
  },
  403: {
    tone: 'neutral',
    icon: 'shield',
    kicker: 'Authorization outcome — expected',
    title: 'Not permitted',
    body:
      'The server refused this action. You may not be the reviewer assigned to that slot, the request may not be yours to see, or you may have tried to review your own request.',
    action:
      'This is a normal authorization result, not a crash. The server is the gate; the UI never enforces eligibility.',
  },
  404: {
    tone: 'muted',
    icon: 'search',
    kicker: 'Object-level visibility',
    title: 'Not found or not visible',
    body:
      'The request may not exist, or the server may not disclose it to your identity. A 404 is also used when the server does not want to reveal that an object exists.',
    action:
      'Object-level visibility belongs to the server. The UI does not decide what you may see.',
  },
  409: {
    tone: 'conflict',
    icon: 'pause',
    kicker: 'State conflict',
    title: 'Conflict — already decided',
    body:
      'You already voted on this request, or the request is already final. A denial is terminal; later approvals cannot reverse it.',
    action:
      'Reload the request to see the current server state. One reviewer gets one decision per request.',
  },
  422: {
    tone: 'danger',
    icon: '!',
    kicker: 'Validation',
    title: 'Invalid input',
    body:
      'The server rejected the submitted fields. Check the amount, required text, and length limits.',
    action:
      'Client-side checks are a convenience only. The server validates the same rules again.',
  },
  network: {
    tone: 'danger',
    icon: '~',
    kicker: 'Transport',
    title: 'Could not reach the API',
    body:
      'The request did not complete. This sandbox uses local fixtures, so a network failure here means the fetch adapter was selected without a server.',
    action: 'Retry, or switch the API client back to the fixture adapter for the sandbox.',
  },
};

export default function ApiErrorNotice({
  error,
  context,
}: {
  error: ApiFailure;
  context?: string;
}) {
  const copy = COPY[error.code];

  return (
    <section className={`api-error tone-${copy.tone}`} role="alert">
      <div className="api-error-icon" aria-hidden="true">
        {copy.icon}
      </div>
      <div className="api-error-body">
        <p className="kicker">{context ?? copy.kicker}</p>
        <h2>
          {copy.title} <span className="code">{error.code}</span>
        </h2>
        <p>{copy.body}</p>
        <p className="api-error-action">{copy.action}</p>
        {error.message ? (
          <p className="api-error-detail">Adapter message: {error.message}</p>
        ) : null}
      </div>
    </section>
  );
}
