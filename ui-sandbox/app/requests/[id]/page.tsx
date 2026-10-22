import Link from 'next/link';
import { Suspense } from 'react';
import RequestDetailClient from './RequestDetailClient';

function DetailFallback() {
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

export default function RequestDetailPage() {
  return (
    <Suspense fallback={<DetailFallback />}>
      <RequestDetailClient />
    </Suspense>
  );
}
