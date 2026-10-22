import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { connection } from 'next/server'
import { demoEnabled } from '@/lib/demo'
import { getTideConfig } from '@/lib/config'
import SessionProvider from '@/components/SessionProvider'
import AppShell from '@/components/AppShell'
import './globals.css'


export const metadata: Metadata = {
  title: 'Spend Approval',
  description: 'Three reviewers. Every decision accounted for.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  await connection()
  const config = demoEnabled() ? null : getTideConfig()
  return (
    <html lang="en">
      <body>
        <SessionProvider config={config}>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  )
}
