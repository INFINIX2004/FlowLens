import { prisma } from './prisma'

// Industry benchmarks (based on DORA 2023 report - elite/high performers)
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
  // Lower is better for these metrics
  if (value <= b.elite) return 'elite'
  if (value <= b.high) return 'high'
  if (value <= b.medium) return 'medium'
  return 'low'
}

export async function getDORAMetrics(orgId: string) {
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

  const prsWithCycleTime = allPRs.filter(pr => pr.cycleTimeHrs !== null)
  const avgLeadTime = prsWithCycleTime.length > 0
    ? prsWithCycleTime.reduce((sum, pr) => sum + pr.cycleTimeHrs!, 0) / prsWithCycleTime.length
    : null

  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentDeploys = allDeploys.filter(d => d.deployedAt > fourWeeksAgo)
  const deployFrequency = recentDeploys.length > 0 ? recentDeploys.length / 4 : null

  const failedDeploys = allDeploys.filter(d => d.status === 'failure')
  const changeFailureRate = allDeploys.length > 0
    ? (failedDeploys.length / allDeploys.length) * 100
    : null

  return {
    leadTime: avgLeadTime ? Math.round(avgLeadTime * 10) / 10 : null,
    deployFrequency: deployFrequency ? Math.round(deployFrequency * 10) / 10 : null,
    changeFailureRate: changeFailureRate ? Math.round(changeFailureRate * 10) / 10 : null,
    mttr: null,
    totalPRs: allPRs.length,
    totalDeploys: allDeploys.length,
  }
}