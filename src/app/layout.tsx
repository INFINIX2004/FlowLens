import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowLens',
  description: 'Engineering Analytics Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ background: '#0E0B1E', color: '#F0EEFF' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}