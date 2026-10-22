'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ACTING_SUB_EVENT,
  DATA_SOURCE,
  api,
  listSandboxIdentities,
  setActingSub,
} from '@/lib-ui/api-client';
import type { Me } from '@/lib-ui/api-client';

const identities = listSandboxIdentities();

export default function AppHeader() {
  const [me, setMe] = useState<Me | null>(null);

  // Sandbox-only deep link for demos and automated checks, e.g. ?viewer=<fixture sub>.
  // It is not authentication: it only chooses which fixture identity the mock server uses.
  useEffect(() => {
    const viewer = new URLSearchParams(window.location.search).get('viewer');
    if (viewer) setActingSub(viewer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMe = () => {
      void api.getMe().then((result) => {
        if (!cancelled && result.ok) setMe(result.data);
      });
    };

    loadMe();
    window.addEventListener(ACTING_SUB_EVENT, loadMe);
    return () => {
      cancelled = true;
      window.removeEventListener(ACTING_SUB_EVENT, loadMe);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="stub-banner" role="status">
        <strong>SANDBOX STUB</strong>
        <span>
          Synthetic fixture data. No real authentication, no TideCloak, no server. Votes
          are simulated locally and are not approvals. This sandbox also shows every
          request regardless of who is viewing — the real API scopes by identity.{' '}
          <code>stub_present: true</code>
        </span>
      </div>

      <div className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">SA</span>
          <span>
            Spend approvals
            <small>UI sandbox</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Sandbox navigation">
          <Link href="/">Requests</Link>
          <Link href="/requests/new">New request</Link>
          <Link href="/state-lab">Error states</Link>
        </nav>

        <div className="viewer-picker">
          <span className="source-indicator" title="Data source selected in the API client">
            data: {DATA_SOURCE}
          </span>
          <label htmlFor="sandbox-viewer">
            Simulated viewer
            <small>sandbox only, not a login</small>
          </label>
          <select
            id="sandbox-viewer"
            value={me?.sub ?? ''}
            onChange={(event) => {
              if (setActingSub(event.target.value)) {
                void api.getMe().then((result) => {
                  if (result.ok) setMe(result.data);
                });
              }
            }}
            disabled={identities.length === 0}
          >
            {identities.length === 0 ? <option value="">No identities</option> : null}
            {identities.map((identity) => (
              <option key={identity.sub} value={identity.sub}>
                {identity.displayName} ({identity.sub})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
