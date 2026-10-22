import { explainStatus } from '@/lib-ui/explain-status';
import type { SpendRequest } from '@/types/contract';
import ReviewerProgress from './ReviewerProgress';
import StatusBadge from './StatusBadge';

/**
 * The decision result panel explains the decision log. It never computes the status used
 * by the badge; the badge reads request.status directly inside StatusBadge.
 */
export default function DecisionResultPanel({ request }: { request: SpendRequest }) {
  const result = explainStatus(request);

  return (
    <section
      className={`result-panel result-${request.status}`}
      aria-labelledby="decision-result-heading"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Decision result</p>
          <h2 id="decision-result-heading">What the decision log says</h2>
        </div>
        <StatusBadge request={request} />
      </div>

      <p className="explanation">{result.explanation}</p>

      <ReviewerProgress request={request} showAssigned />

      <p className="fine-print">
        A rejection is final. All three distinct reviewers must approve for this expense to be approved.
      </p>
    </section>
  );
}
