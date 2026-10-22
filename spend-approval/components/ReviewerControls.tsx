'use client';

import { useState } from 'react';
import { useSpendApi } from '@/lib-ui/use-spend-api';
import type { ApiFailure } from '@/lib-ui/api-client';
import { ROLE_SLOTS, SLOT_LABELS, decisionForSlot } from '@/lib-ui/slots';
import type { SpendRequest, Vote } from '@/types/contract';

export default function ReviewerControls({
  request,
  actingSub,
  roles,
  onUpdated,
  onError,
}: {
  request: SpendRequest;
  actingSub: string | null;
  roles: string[];
  onUpdated: (request: SpendRequest) => void;
  onError: (error: ApiFailure) => void;
}) {
  const api = useSpendApi();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState<Vote | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const slot = actingSub
    ? ROLE_SLOTS.find((candidate) => request.assignedReviewers[candidate] === actingSub)
    : undefined;
  const existing = slot ? decisionForSlot(request, slot) : undefined;
  const isRequester = actingSub !== null && request.requesterSub === actingSub;
  const hasRole = !!slot && roles.includes(slot === 'ceo' ? 'spend_ceo_reviewer' : 'spend_senior_reviewer');

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
        `Your ${vote} for ${SLOT_LABELS[slot]} was recorded. The request is ${result.data.status}.`,
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
  else if (!slot || !hasRole || isRequester) state = 'blocked';

  return (
    <section className={`reviewer-controls controls-${state}`} aria-labelledby="reviewer-controls-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Reviewer controls</p>
          <h2 id="reviewer-controls-heading">Cast one decision</h2>
        </div>
        <span className="acting-chip">
          Signed in as <code>{actingSub ?? 'session unavailable'}</code>
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
          <strong>Your session could not be verified.</strong> Sign out and sign in again.
        </div>
      ) : isRequester ? (
        <div className="control-message">
          <strong>You are the requester.</strong> You cannot review your own request.
        </div>
      ) : !slot ? (
        <div className="control-message">
          <strong>You are not an assigned reviewer for this request.</strong>
        </div>
      ) : !hasRole ? (
        <div className="control-message"><strong>Your reviewer role is missing.</strong> Ask your workspace administrator to check your role, then sign in again.</div>
      ) : existing ? (
        <div className="control-message">
          <strong>You already voted {existing.vote}.</strong> One reviewer gets one decision
          per request.
          {existing.comment ? (
            <span className="decision-comment">Your comment: “{existing.comment}”</span>
          ) : null}
        </div>
      ) : (
        <>
          <p className="control-lede">
            You are the assigned reviewer for <strong>{slot ? SLOT_LABELS[slot] : ''}</strong>.
            Your decision cannot be changed after submission.
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
        A rejection is final. All three distinct reviewers must approve for this expense to be approved.
      </p>
    </section>
  );
}
