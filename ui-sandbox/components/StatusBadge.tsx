import { explainStatus } from '@/lib-ui/explain-status';
import type { SpendRequest } from '@/types/contract';

/**
 * The badge renders `request.status` and nothing else. `derivedStatus` is shown only in
 * the disagreement warning, never used as the badge value.
 */
export default function StatusBadge({ request }: { request: SpendRequest }) {
  const result = explainStatus(request);

  return (
    <div className={`status-cluster${result.matchesServerStatus ? '' : ' has-mismatch'}`}>
      <span
        className={`badge badge-${request.status}`}
        data-status={request.status}
        title="Server status (request.status)"
      >
        {request.status}
        <span className="badge-source">server</span>
      </span>

      {!result.matchesServerStatus ? (
        <span className="mismatch-warning" role="status">
          <span className="warning-mark" aria-hidden="true">
            !
          </span>
          <span>
            <strong>Data disagreement.</strong> Server status is{' '}
            <strong>{request.status}</strong>, but the decision log reads{' '}
            <strong>{result.derivedStatus}</strong>. The badge shows the server value.
          </span>
        </span>
      ) : null}
    </div>
  );
}
