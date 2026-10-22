import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppHeader from '@/components/AppHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spend Approval — UI sandbox',
  description:
    'Synthetic-data workbench for the RMIT Hackathon 2026 spend approval flow. No real authentication.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main className="shell">{children}</main>
        <footer className="site-footer">
          <span>
            Sandbox only. Synthetic fixtures, no real approvals, no TideCloak integration in
            this workbench.
          </span>
          <span>
            <code>stub_present: true</code> · status is rendered from the server value
          </span>
        </footer>
      </body>
    </html>
  );
}
