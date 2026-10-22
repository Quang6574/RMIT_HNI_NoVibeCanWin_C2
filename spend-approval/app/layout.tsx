import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  TideCloakProvider
} from '@tidecloak/nextjs'
import tcConfig from '../tidecloak.json'
import AppShell from '@/components/AppShell'
import './globals.css'


export const metadata: Metadata = {
  title: 'Spend Approval',
  description: 'Three reviewers. Every decision accounted for.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <TideCloakProvider config={tcConfig}>
          <AppShell>{children}</AppShell>
        </TideCloakProvider>
      </body>
    </html>
  )
}
