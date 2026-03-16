import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDORAMetrics } from '@/lib/metrics'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: userId },
  })

  if (!org) return NextResponse.json({
    deployFrequency: null,
    leadTime: null,
    changeFailureRate: null,
    mttr: null,
    avgCycleTime: null,
  })

  const metrics = await getDORAMetrics(org.id)

  const prs = await prisma.pullRequest.findMany({
    where: {
      repo: { orgId: org.id },
      mergedAt: { not: null },
      cycleTimeHrs: { not: null },
    },
    select: { cycleTimeHrs: true },
  })

  const avgCycleTime = prs.length > 0
    ? prs.reduce((s, p) => s + p.cycleTimeHrs!, 0) / prs.length
    : null

  return NextResponse.json({
    ...metrics,
    avgCycleTime,
  })
}
