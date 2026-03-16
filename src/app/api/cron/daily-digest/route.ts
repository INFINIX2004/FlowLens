export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notifySlack } from '@/lib/slack'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Verify secret so only your cron service can trigger this
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    include: { slackConfig: true },
  })

  const results = []

  for (const org of orgs) {
    // Skip orgs that haven't enabled daily_digest
    if (!org.slackConfig?.events.includes('daily_digest')) continue

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Count PRs merged today
    const merged = await prisma.pullRequest.count({
      where: {
        repo: { orgId: org.id },
        mergedAt: { gte: today },
      },
    })

    // Avg cycle time of PRs merged today
    const prs = await prisma.pullRequest.findMany({
      where: {
        repo: { orgId: org.id },
        mergedAt: { gte: today },
        cycleTimeHrs: { not: null },
      },
      select: { cycleTimeHrs: true },
    })

    const avgCycleTime = prs.length > 0
      ? (prs.reduce((s, p) => s + p.cycleTimeHrs!, 0) / prs.length).toFixed(1)
      : '-'

    await notifySlack(org.id, 'daily_digest', {
      merged,
      avgCycleTime,
    })

    results.push({ orgId: org.id, merged, avgCycleTime })
  }

  return NextResponse.json({ ok: true, results })
}
