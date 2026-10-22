'use client';
import { usePathname } from 'next/navigation';
import { useTideCloak } from '@tidecloak/nextjs';
import type { ReactNode } from 'react';
import AppHeader from './AppHeader';

export default function AppShell({ children }: { children: ReactNode }) {
  const { authenticated, isInitializing, initError, login } = useTideCloak();
  const pathname = usePathname();
  if (pathname === '/auth/redirect') return children;
  if (isInitializing) return <main className="shell" role="status">Connecting to TideCloak…</main>;
  if (!authenticated || initError) return (
    <main className="shell"><div className="card">
      <p className="eyebrow">RMIT × Tide</p><h1>Spend Approval</h1>
      <p className="lede">Submit a fictional expense. Two senior reviewers and the CEO must each approve it. Any rejection ends the request.</p>
      {initError ? <p role="alert">Sign-in could not connect. Check that TideCloak is running, then reload this page.</p> : null}
      <button className="btn btn-primary" onClick={() => void login()}>Log in with Tide</button>
    </div></main>
  );
  return <><AppHeader /><main className="shell" id="main-content">{children}</main><footer className="site-footer">Demo expenses only. No payments move.</footer></>;
}
