import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDORAMetrics } from '@/lib/metrics'
import { generateMetricsPDF } from '@/lib/pdf'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

  const dora = await getDORAMetrics(org.id)

  const prs = await prisma.pullRequest.findMany({
    where: { repo: { orgId: org.id }, mergedAt: { not: null } },
    select: { authorLogin: true, cycleTimeHrs: true, reviewWaitHrs: true },
  })

  const authorCounts = prs.reduce<Record<string, number>>((acc, pr) => {
    acc[pr.authorLogin] = (acc[pr.authorLogin] ?? 0) + 1
    return acc
  }, {})

  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([login, count]) => ({ login, count }))

  const avgCycleTime = prs.filter(p => p.cycleTimeHrs).reduce((s, p) => s + p.cycleTimeHrs!, 0) / (prs.filter(p => p.cycleTimeHrs).length || 1)
  const avgReviewWait = prs.filter(p => p.reviewWaitHrs).reduce((s, p) => s + p.reviewWaitHrs!, 0) / (prs.filter(p => p.reviewWaitHrs).length || 1)

  const buffer = await generateMetricsPDF({
    orgName: org.name,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dora,
    prStats: { totalPRs: prs.length, avgCycleTime, avgReviewWait, topAuthors },
  })

  return new Response(Uint8Array.from(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="flowlens-report-${Date.now()}.pdf"`,
    },
  })
}
