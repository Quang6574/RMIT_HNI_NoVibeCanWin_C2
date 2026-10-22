'use client';

import { useState } from 'react';
import { api } from '@/lib-ui/api-client';
import type { ApiFailure } from '@/lib-ui/api-client';
import { ROLE_SLOTS, SLOT_LABELS, decisionForSlot } from '@/lib-ui/slots';
import type { SpendRequest, Vote } from '@/types/contract';

export default function ReviewerControls({
  request,
  actingSub,
  onUpdated,
  onError,
}: {
  request: SpendRequest;
  actingSub: string | null;
  onUpdated: (request: SpendRequest) => void;
  onError: (error: ApiFailure) => void;
}) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState<Vote | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const slot = actingSub
    ? ROLE_SLOTS.find((candidate) => request.assignedReviewers[candidate] === actingSub)
    : undefined;
  const existing = slot ? decisionForSlot(request, slot) : undefined;
  const isRequester = actingSub !== null && request.requesterSub === actingSub;

  async function submit(vote: Vote) {
    if (!slot || submitting) return;

    setSubmitting(vote);
    setNotice(null);

    const result = await api.submitDecision(request.id, {
      roleSlot: slot,
      vote,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    });

    setSubmitting(null);

    if (result.ok) {
      setComment('');
      setNotice(
        `The sandbox server recorded your ${vote} for ${SLOT_LABELS[slot]}. The returned status is ${result.data.status}.`,
      );
      onUpdated(result.data.request);
      return;
    }

    onError(result);
  }

  let state: 'ready' | 'closed' | 'blocked' | 'voted' = 'ready';
  if (request.status !== 'pending') state = 'closed';
  else if (!actingSub) state = 'blocked';
  else if (existing) state = 'voted';
  else if (!slot) state = 'blocked';

  return (
    <section className={`reviewer-controls controls-${state}`} aria-labelledby="reviewer-controls-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Reviewer controls</p>
          <h2 id="reviewer-controls-heading">Cast one decision</h2>
        </div>
        <span className="acting-chip">
          acting as <code>{actingSub ?? 'no viewer'}</code>
        </span>
      </div>

      {request.status !== 'pending' ? (
        <div className="control-message">
          <strong>Votes are closed.</strong> This request is already{' '}
          <span className={`inline-status inline-${request.status}`}>{request.status}</span>.{' '}
          {request.status === 'denied'
            ? 'A denial is terminal; later approvals cannot reverse it.'
            : 'It is final.'}
        </div>
      ) : !actingSub ? (
        <div className="control-message">
          <strong>No simulated viewer is selected.</strong> The header selector is a sandbox
          convenience, not a login.
        </div>
      ) : isRequester ? (
        <div className="control-message">
          <strong>You are the requester.</strong> Self-review is blocked by the server, which
          would return 403 if a vote were submitted anyway. The controls are hidden here for
          convenience.
        </div>
      ) : !slot ? (
        <div className="control-message">
          <strong>You are not an assigned reviewer for this request.</strong> Controls are
          hidden for convenience; a direct request to the server would return 403. The server
          owns that decision.
        </div>
      ) : existing ? (
        <div className="control-message">
          <strong>You already voted {existing.vote}.</strong> One reviewer gets one decision
          per request. A second attempt would return 409.
          {existing.comment ? (
            <span className="decision-comment">Your comment: “{existing.comment}”</span>
          ) : null}
        </div>
      ) : (
        <>
          <p className="control-lede">
            You are the assigned reviewer for <strong>{SLOT_LABELS[slot]}</strong>. The
            buttons below are a convenience only; the server checks the slot, identity,
            one-vote rule, and terminal state.
          </p>

          <label className="comment-field" htmlFor="decision-comment">
            Comment <span>(optional, 200 characters)</span>
            <textarea
              id="decision-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
              placeholder="Add context for the requester and the audit trail."
            />
            <span className="counter">{comment.length}/200</span>
          </label>

          <div className="vote-buttons">
            <button
              className="btn btn-approve"
              type="button"
              disabled={submitting !== null}
              onClick={() => void submit('approve')}
            >
              {submitting === 'approve' ? 'Submitting…' : 'Approve'}
            </button>
            <button
              className="btn btn-reject"
              type="button"
              disabled={submitting !== null}
              onClick={() => void submit('reject')}
            >
              {submitting === 'reject' ? 'Submitting…' : 'Reject'}
            </button>
          </div>
        </>
      )}

      {notice ? <p className="control-notice">{notice}</p> : null}

      <p className="control-disclaimer">
        Convenience only. Nothing in this component grants eligibility or enforces a role.
        The real API verifies the TideCloak identity and the assigned slot before accepting a
        vote. A rejection is terminal; all three distinct slots are required for approval.
      </p>
    </section>
  );
}
