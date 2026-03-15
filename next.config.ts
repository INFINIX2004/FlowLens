import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bullmq'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

export default withSentryConfig(nextConfig, {
  org: 'flowlens-ba',
  project: 'flowlens',
  silent: !process.env.CI,
  widenClientFileUpload: true,
})