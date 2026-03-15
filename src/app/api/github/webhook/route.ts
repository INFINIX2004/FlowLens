import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureSyncWorkerStarted, syncQueue } from '@/lib/queue'
import crypto from 'crypto'

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false

  const hmac = crypto.createHmac('sha256', secret)
  const digest = `sha256=${hmac.update(payload).digest('hex')}`

  if (digest.length !== signature.length) return false

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''
  const event = request.headers.get('x-github-event') ?? ''

  // Verify webhook signature
  if (!verifySignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(payload)

  if (event === 'ping') {
    return NextResponse.json({ received: true, event: 'ping' })
  }

  // Find org by GitHub login
  const org = await prisma.organization.findFirst({
    where: { githubLogin: body.repository?.owner?.login ?? body.organization?.login },
  })

  if (!org) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  // Handle relevant events
  const triggerEvents = [
    'deployment',
    'issue_comment',
    'pull_request',
    'pull_request_review',
    'push',
    'release',
    'workflow_run',
  ]

  if (triggerEvents.includes(event)) {
    console.log(`Webhook received: ${event} for org ${org.githubLogin}`)

    ensureSyncWorkerStarted()

    // Enqueue incremental sync
    await syncQueue.add(
      'sync',
      { orgId: org.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        // Deduplicate — don't queue if one is already pending
        jobId: `webhook-${org.id}-${Date.now()}`,
      }
    )
  }

  return NextResponse.json({ received: true, event })
}
