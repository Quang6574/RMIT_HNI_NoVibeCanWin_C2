'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import { useSpendApi } from '@/lib-ui/use-spend-api';
import type { ApiFailure, Me } from '@/lib-ui/api-client';
import ApiErrorNotice from './ApiErrorNotice';
import { useDemoSession } from './SessionProvider';
import { DEMO_IDENTITIES } from '@/lib-ui/demo-identities';
import { useRouter } from 'next/navigation';

export default function AppHeader() {
  const demo = useDemoSession();
  const router = useRouter();
  if (!demo) return <LiveHeader />;
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="simulation-banner" role="status"><strong>LOCAL SIMULATION</strong> Demo identities are selected below. Live Tide verification and governance are not being used.</div>
    <header className="app-header"><div className="topbar">
      <Link className="brand" href="/">Spend Approval</Link>
      <nav className="main-nav" aria-label="Main navigation"><Link href="/">Requests</Link>
        {demo.identity === 'demo-requester' ? <Link href="/requests/new">New request</Link> : null}
      </nav>
      <label className="demo-picker">Demo identity{' '}
        <select value={demo.identity} onChange={event => { demo.selectIdentity(event.target.value); router.push('/'); }}>
          {DEMO_IDENTITIES.map(actor => <option key={actor.sub} value={actor.sub}>{actor.displayName}</option>)}
        </select>
      </label>
    </div></header>
  </>;
}

function LiveHeader() {
  const api = useSpendApi();
  const { logout } = useTideCloak();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  useEffect(() => {
    let alive = true;
    void api.getMe().then(result => {
      if (!alive) return;
      if (result.ok) { setMe(result.data); setError(null); }
      else { setMe(null); setError(result); }
    });
    return () => { alive = false; };
  }, [api]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header">
      <div className="topbar">
      <Link className="brand" href="/">Spend Approval</Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link className="text-link" href="/">Requests</Link>{' '}
        {me?.roles.includes('spend_requester') ? <Link className="text-link" href="/requests/new">New request</Link> : null}
      </nav>
      <span>{me?.displayName ?? 'Checking session…'}</span>
      <button className="btn btn-ghost" onClick={() => void logout()}>Log out</button>
      </div>
    </header>
    {error ? <div className="page"><ApiErrorNotice error={error} context="Checking session" /></div> : null}
    {me && !me.roles.some(role => ['spend_requester', 'spend_senior_reviewer', 'spend_ceo_reviewer'].includes(role)) ?
      <p className="account-notice" role="status">Your account has no spending role yet. Ask your workspace administrator to assign your role, then sign in again.</p> : null}
  </>;
}
