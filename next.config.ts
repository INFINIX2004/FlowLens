import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bullmq', '@react-pdf/renderer'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

export default withSentryConfig(nextConfig, {
  org: 'flowlens-ba',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
})