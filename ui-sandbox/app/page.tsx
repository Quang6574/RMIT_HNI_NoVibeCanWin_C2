'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ApiErrorNotice from '@/components/ApiErrorNotice';
import ReviewerProgress from '@/components/ReviewerProgress';
import StatusBadge from '@/components/StatusBadge';
import { ACTING_SUB_EVENT, api } from '@/lib-ui/api-client';
import type { ApiFailure } from '@/lib-ui/api-client';
import { formatDateTime, formatMoney } from '@/lib-ui/slots';
import type { SpendRequest } from '@/types/contract';

export default function RequestListPage() {
  const [requests, setRequests] = useState<SpendRequest[] | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);

  useEffect(() => {
    let alive = true;

    const load = () => {
      void api.listRequests().then((result) => {
        if (!alive) return;
        if (result.ok) {
          setRequests(result.data);
          setError(null);
        } else {
          setError(result);
        }
      });
    };

    load();
    window.addEventListener(ACTING_SUB_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(ACTING_SUB_EVENT, load);
    };
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Request list</p>
          <h1>Spend requests</h1>
          <p className="lede">
            Every row shows the server&apos;s status, the three named reviewer slots, and a
            decision-log explanation. Open a row for the full record and reviewer controls.
          </p>
        </div>
        <Link className="btn btn-primary" href="/requests/new">
          New request
        </Link>
      </div>

      <div className="sandbox-note">
        <strong>Sandbox visibility.</strong> This fixture adapter returns every fixture
        regardless of the simulated viewer so all states can be inspected. The real API scopes
        the list by identity; the UI makes no visibility decision.
      </div>

      {error ? <ApiErrorNotice error={error} context="Loading request list" /> : null}

      {!error && requests === null ? (
        <div className="loading-stack" aria-live="polite">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : null}

      {!error && requests !== null && requests.length === 0 ? (
        <div className="empty-state">
          <h2>No requests visible</h2>
          <p>The fixture adapter returned an empty list. Create one to exercise the form.</p>
          <Link className="btn btn-primary" href="/requests/new">
            Create a request
          </Link>
        </div>
      ) : null}

      {!error && requests !== null && requests.length > 0 ? (
        <div className="request-list">
          {requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div className="request-main">
                <div className="request-title-row">
                  <div>
                    <Link className="request-title" href={`/requests/${request.id}`}>
                      {request.title}
                    </Link>
                    <p className="request-subline">
                      <code>{request.id}</code>
                      <span>·</span>
                      <span>{request.category}</span>
                      <span>·</span>
                      <span>created {formatDateTime(request.createdAt)}</span>
                    </p>
                  </div>
                  <div className="amount-block">
                    <span className="amount">
                      {formatMoney(request.amountMinor, request.currency)}
                    </span>
                    <span className="amount-note">{request.currency}</span>
                  </div>
                </div>

                <StatusBadge request={request} />

                <ReviewerProgress request={request} />

                <div className="request-footer">
                  <span>
                    Requester <code>{request.requesterSub}</code>
                  </span>
                  <Link className="text-link" href={`/requests/${request.id}`}>
                    Open request →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
