import { prisma } from './prisma'

export async function takeMetricsSnapshot(orgId: string) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const repos = await prisma.repository.findMany({
    where: { orgId },
    include: {
      pullRequests: {
        where: { mergedAt: { not: null } },
        orderBy: { mergedAt: 'desc' },
        take: 100,
      },
      deployments: {
        orderBy: { deployedAt: 'desc' },
        take: 100,
      },
    },
  })

  const allPRs = repos.flatMap(r => r.pullRequests)
  const allDeploys = repos.flatMap(r => r.deployments)

  const avg = (arr: number[]) => arr.length > 0
    ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentDeploys = allDeploys.filter(d => d.deployedAt > fourWeeksAgo)
  const failedDeploys = allDeploys.filter(d => d.status === 'failure')

  const snapshot = {
    orgId,
    period: 'week',
    periodStart: weekStart,
    deployFrequency: recentDeploys.length > 0 ? recentDeploys.length / 4 : null,
    leadTime: avg(allPRs.filter(p => p.cycleTimeHrs).map(p => p.cycleTimeHrs!)),
    changeFailureRate: allDeploys.length > 0
      ? (failedDeploys.length / allDeploys.length) * 100 : null,
    mttr: null,
    totalPRs: allPRs.length,
    totalDeploys: allDeploys.length,
    avgCycleTime: avg(allPRs.filter(p => p.cycleTimeHrs).map(p => p.cycleTimeHrs!)),
    avgCodingTime: avg(allPRs.filter(p => p.codingTimeHrs).map(p => p.codingTimeHrs!)),
    avgReviewWaitTime: avg(allPRs.filter(p => p.reviewWaitHrs).map(p => p.reviewWaitHrs!)),
    avgReviewTime: avg(allPRs.filter(p => p.reviewTimeHrs).map(p => p.reviewTimeHrs!)),
    avgMergeDelay: avg(allPRs.filter(p => p.mergeDelayHrs).map(p => p.mergeDelayHrs!)),
  }

  await prisma.metricsSnapshot.upsert({
    where: { orgId_period_periodStart: { orgId, period: 'week', periodStart: weekStart } },
    update: snapshot,
    create: snapshot,
  })

  console.log(`Metrics snapshot saved for org ${orgId}`)
  return snapshot
}