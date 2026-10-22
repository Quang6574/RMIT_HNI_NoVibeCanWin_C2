'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ApiErrorNotice from '@/components/ApiErrorNotice';
import DecisionResultPanel from '@/components/DecisionResultPanel';
import ReviewerControls from '@/components/ReviewerControls';
import { useSpendApi } from '@/lib-ui/use-spend-api';
import type { ApiFailure, Me } from '@/lib-ui/api-client';
import {
  ROLE_SLOTS,
  SLOT_LABELS,
  decisionForSlot,
  formatDateTime,
  formatMoney,
  slotState,
} from '@/lib-ui/slots';
import type { SpendRequest } from '@/types/contract';

export default function RequestDetailPage() {
  const api = useSpendApi();
  const params = useParams();
  const rawId = params?.id;
  const requestId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [request, setRequest] = useState<SpendRequest | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState<ApiFailure | null>(null);
  const [controlError, setControlError] = useState<ApiFailure | null>(null);

  useEffect(() => {
    let alive = true;

    const load = () => {
      if (!requestId) return;

      void Promise.all([api.getRequest(requestId), api.getMe()]).then(
        ([requestResult, meResult]) => {
          if (!alive) return;

          if (requestResult.ok) {
            setRequest(requestResult.data);
            setLoadError(null);
          } else {
            setLoadError(requestResult);
          }

          setMe(meResult.ok ? meResult.data : null);
        },
      );
    };

    load();
    return () => {
      alive = false;
    };
  }, [requestId, api]);

  if (loadError) {
    return (
      <div className="page">
        <Link className="back-link" href="/">
          ← All requests
        </Link>
        <ApiErrorNotice error={loadError} context="Loading request detail" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page" aria-live="polite">
        <Link className="back-link" href="/">
          ← All requests
        </Link>
        <div className="loading-stack">
          <div className="skeleton skeleton-title" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Link className="back-link" href="/">
        ← All requests
      </Link>

      <div className="detail-head">
        <div>
          <p className="eyebrow">Request detail</p>
          <h1>{request.title}</h1>
          <p className="request-subline">
            <code>{request.id}</code>
            <span>·</span>
            <span>{request.category}</span>
            <span>·</span>
            <span>created {formatDateTime(request.createdAt)}</span>
          </p>
        </div>
        <div className="detail-amount">
          <span className="amount">{formatMoney(request.amountMinor, request.currency)}</span>
          <span className="amount-note">{request.currency}</span>
        </div>
      </div>

      <DecisionResultPanel request={request} />

      <div className="detail-grid">
        <section className="card" aria-labelledby="record-heading">
          <div className="card-head">
            <div>
              <p className="eyebrow">Request detail</p>
              <h2 id="record-heading">The submitted record</h2>
            </div>
            <span className="server-tag">submitted</span>
          </div>

          <dl className="field-list">
            <div>
              <dt>Amount</dt>
              <dd>
                {formatMoney(request.amountMinor, request.currency)}
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{request.category}</dd>
            </div>
            <div>
              <dt>Requester</dt>
              <dd>
                <code>{request.requesterSub}</code>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(request.createdAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`inline-status inline-${request.status}`}>{request.status}</span>
              </dd>
            </div>
            <div>
              <dt>Request id</dt>
              <dd>
                <code>{request.id}</code>
              </dd>
            </div>
          </dl>

          <h3 className="subsection-heading">Business reason</h3>
          <p className="reason">{request.businessReason}</p>
        </section>

        <section className="card" aria-labelledby="slots-heading">
          <div className="card-head">
            <div>
              <p className="eyebrow">Reviewer slots</p>
              <h2 id="slots-heading">Three distinct decisions</h2>
            </div>
            <span className="server-tag">assigned reviewers</span>
          </div>

          <div className="slot-cards">
            {ROLE_SLOTS.map((slot) => {
              const decision = decisionForSlot(request, slot);
              const state = slotState(request, slot);

              return (
                <article className={`slot-card slot-card-${state}`} key={slot}>
                  <div className="slot-card-head">
                    <div>
                      <p className="slot-label">{SLOT_LABELS[slot]}</p>
                      <code>{request.assignedReviewers[slot]}</code>
                    </div>
                    <span className={`state-pill state-${state}`}>{state}</span>
                  </div>

                  {decision ? (
                    <div className="decision-body">
                      <p>
                        <strong>{decision.vote}</strong> · {formatDateTime(decision.decidedAt)}
                      </p>
                      {decision.comment ? (
                        <blockquote>“{decision.comment}”</blockquote>
                      ) : (
                        <p className="muted">No comment recorded.</p>
                      )}
                    </div>
                  ) : (
                    <p className="muted">
                      No decision yet. This reviewer must approve before the request can be approved.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {controlError ? (
        <ApiErrorNotice error={controlError} context="Submitting decision" />
      ) : null}

      <ReviewerControls
        request={request}
        actingSub={me?.sub ?? null}
        roles={me?.roles ?? []}
        onUpdated={(updated) => {
          setRequest(updated);
          setControlError(null);
        }}
        onError={(error) => {
          setControlError(error);
        }}
      />
    </div>
  );
}
