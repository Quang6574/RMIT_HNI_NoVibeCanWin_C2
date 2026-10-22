'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ApiErrorNotice from '@/components/ApiErrorNotice';
import ReviewerProgress from '@/components/ReviewerProgress';
import StatusBadge from '@/components/StatusBadge';
import { useSpendApi } from '@/lib-ui/use-spend-api';
import type { ApiFailure } from '@/lib-ui/api-client';
import { formatDateTime, formatMoney } from '@/lib-ui/slots';
import type { SpendRequest } from '@/types/contract';

export default function RequestListPage() {
  const api = useSpendApi();
  const [requests, setRequests] = useState<SpendRequest[] | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    let alive = true;
    void api.getMe().then(result => {
      if (alive) setCanCreate(result.ok && result.data.roles.includes('spend_requester'));
    });

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
    return () => {
      alive = false;
    };
  }, [api]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Request list</p>
          <h1>Spend requests</h1>
          <p className="lede">
            Track your expenses and review requests assigned to you. Open a request to see
            each reviewer&apos;s decision and what happens next.
          </p>
        </div>
        {canCreate ? <Link className="btn btn-primary" href="/requests/new">
          New request
        </Link> : null}
      </div>

      <div className="sandbox-note">
        Requests you submitted and requests assigned to you appear here. Refresh this page
        to see other reviewers&apos; latest decisions.
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
          <p>You have no requests to view yet. A requester can submit a new expense; assigned reviewers will then see it here.</p>
          {canCreate ? <Link className="btn btn-primary" href="/requests/new">
            Create a request
          </Link> : null}
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
