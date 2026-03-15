import { prisma } from './prisma'
import type {
  ActivityDeployment,
  ActivityPullRequest,
  RepositoryWithActivity,
} from './repository-activity-types'

export const BENCHMARKS = {
  deployFrequency: { elite: 7, high: 3, medium: 1, label: 'deploys/week' },
  leadTime: { elite: 24, high: 168, medium: 720, label: 'hours' },
  changeFailureRate: { elite: 5, high: 10, medium: 15, label: '%' },
  mttr: { elite: 1, high: 24, medium: 168, label: 'hours' },
}

export function getPerformanceLevel(metric: string, value: number): 'elite' | 'high' | 'medium' | 'low' {
  const b = BENCHMARKS[metric as keyof typeof BENCHMARKS]
  if (!b) return 'low'
  if (metric === 'deployFrequency') {
    if (value >= b.elite) return 'elite'
    if (value >= b.high) return 'high'
    if (value >= b.medium) return 'medium'
    return 'low'
  }
  if (value <= b.elite) return 'elite'
  if (value <= b.high) return 'high'
  if (value <= b.medium) return 'medium'
  return 'low'
}

export async function getDORAMetrics(orgId: string) {
  // Try reading from latest snapshot first (fast path)
  const snapshot = await prisma.metricsSnapshot.findFirst({
    where: { orgId, period: 'week' },
    orderBy: { periodStart: 'desc' },
  })

  if (snapshot) {
    return {
      leadTime: snapshot.leadTime ? Math.round(snapshot.leadTime * 10) / 10 : null,
      deployFrequency: snapshot.deployFrequency ? Math.round(snapshot.deployFrequency * 10) / 10 : null,
      changeFailureRate: snapshot.changeFailureRate ? Math.round(snapshot.changeFailureRate * 10) / 10 : null,
      mttr: null,
      totalPRs: snapshot.totalPRs,
      totalDeploys: snapshot.totalDeploys,
      fromSnapshot: true,
    }
  }

  // Fallback: compute live
  const repos: RepositoryWithActivity[] = await prisma.repository.findMany({
    where: { orgId },
    include: {
      pullRequests: { where: { mergedAt: { not: null } }, orderBy: { mergedAt: 'desc' }, take: 100 },
      deployments: { orderBy: { deployedAt: 'desc' }, take: 100 },
    },
  })

  const allPRs: ActivityPullRequest[] = repos.flatMap(r => r.pullRequests)
  const allDeploys: ActivityDeployment[] = repos.flatMap(r => r.deployments)
  const prsWithCycleTime = allPRs.filter(pr => pr.cycleTimeHrs !== null)
  const avgLeadTime = prsWithCycleTime.length > 0
    ? prsWithCycleTime.reduce((sum, pr) => sum + pr.cycleTimeHrs!, 0) / prsWithCycleTime.length : null
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentDeploys = allDeploys.filter(d => d.deployedAt > fourWeeksAgo)
  const deployFrequency = recentDeploys.length > 0 ? recentDeploys.length / 4 : null
  const failedDeploys = allDeploys.filter(d => d.status === 'failure')
  const changeFailureRate = allDeploys.length > 0
    ? (failedDeploys.length / allDeploys.length) * 100 : null

  return {
    leadTime: avgLeadTime ? Math.round(avgLeadTime * 10) / 10 : null,
    deployFrequency: deployFrequency ? Math.round(deployFrequency * 10) / 10 : null,
    changeFailureRate: changeFailureRate ? Math.round(changeFailureRate * 10) / 10 : null,
    mttr: null,
    totalPRs: allPRs.length,
    totalDeploys: allDeploys.length,
    fromSnapshot: false,
  }
}
