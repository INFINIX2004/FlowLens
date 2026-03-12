import { prisma } from './prisma'

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

  // Lead Time: average cycle time across all merged PRs
  const allPRs = repos.flatMap(r => r.pullRequests)
  const prsWithCycleTime = allPRs.filter(pr => pr.cycleTimeHrs !== null)
  const avgLeadTime = prsWithCycleTime.length > 0
    ? prsWithCycleTime.reduce((sum, pr) => sum + pr.cycleTimeHrs!, 0) / prsWithCycleTime.length
    : null

  // Deployment Frequency: deployments per week over last 4 weeks
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentDeploys = repos
    .flatMap(r => r.deployments)
    .filter(d => d.deployedAt > fourWeeksAgo)
  const deployFrequency = recentDeploys.length > 0
    ? recentDeploys.length / 4
    : null

  // Change Failure Rate: failed deploys / total deploys
  const allDeploys = repos.flatMap(r => r.deployments)
  const failedDeploys = allDeploys.filter(d => d.status === 'failure')
  const changeFailureRate = allDeploys.length > 0
    ? (failedDeploys.length / allDeploys.length) * 100
    : null

  // MTTR: placeholder until incident data exists
  const mttr = null

  return {
    leadTime: avgLeadTime ? Math.round(avgLeadTime * 10) / 10 : null,
    deployFrequency: deployFrequency ? Math.round(deployFrequency * 10) / 10 : null,
    changeFailureRate: changeFailureRate ? Math.round(changeFailureRate * 10) / 10 : null,
    mttr,
    totalPRs: allPRs.length,
    totalDeploys: allDeploys.length,
  }
}