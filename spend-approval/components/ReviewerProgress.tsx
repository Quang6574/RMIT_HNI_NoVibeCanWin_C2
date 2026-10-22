import {
  ROLE_SLOTS,
  SLOT_LABELS,
  approvedCount,
  decisionForSlot,
  slotState,
} from '@/lib-ui/slots';
import type { SpendRequest } from '@/types/contract';

/**
 * Progress always names the three distinct slots. It never shows a bare "2 of 3".
 */
export default function ReviewerProgress({
  request,
  showAssigned = false,
}: {
  request: SpendRequest;
  showAssigned?: boolean;
}) {
  const approved = approvedCount(request);

  return (
    <div className="reviewer-progress">
      <div className="progress-head">
        <strong>{approved} of 3 approved</strong>
        <span>three distinct slots required</span>
      </div>

      <ul className="slot-chips" aria-label="Reviewer slot progress">
        {ROLE_SLOTS.map((slot) => {
          const state = slotState(request, slot);
          const decision = decisionForSlot(request, slot);

          return (
            <li className={`slot-chip slot-${state}`} key={slot}>
              <span className={`dot dot-${state}`} aria-hidden="true" />
              <span className="slot-name">{SLOT_LABELS[slot]}</span>
              <span className="slot-state">{state}</span>
              {showAssigned ? (
                <span className="slot-sub" title="Assigned reviewer sub">
                  {request.assignedReviewers[slot]}
                </span>
              ) : null}
              {decision?.vote === 'reject' ? (
                <span className="slot-flag">terminal</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {request.status === 'denied' ? (
        <p className="terminal-note">
          Denied is terminal. A rejection stands even if other slots approve later.
        </p>
      ) : null}
    </div>
  );
}
