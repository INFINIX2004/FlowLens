import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGithubRepos, getPullRequests, getDeployments } from '@/lib/github'
import { NextResponse } from 'next/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: userId },
  })

  if (!org?.githubAccessToken) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
  }

  const repos = await getGithubRepos(org.githubAccessToken)
  let totalPRs = 0
  let totalDeploys = 0

  for (const repo of repos.slice(0, 10)) {
    const dbRepo = await prisma.repository.upsert({
      where: { githubId: repo.id },
      update: { name: repo.name, fullName: repo.full_name },
      create: {
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        orgId: org.id,
      },
    })

    // Sync PRs
    const prs = await getPullRequests(org.githubAccessToken, repo.full_name)
    if (Array.isArray(prs)) {
      for (const pr of prs) {
        const cycleTimeHrs = pr.merged_at
          ? (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / 1000 / 60 / 60
          : null

        await prisma.pullRequest.upsert({
          where: { repoId_githubPrId: { repoId: dbRepo.id, githubPrId: pr.number } },
          update: { cycleTimeHrs, mergedAt: pr.merged_at ? new Date(pr.merged_at) : null },
          create: {
            githubPrId: pr.number,
            repoId: dbRepo.id,
            title: pr.title,
            authorLogin: pr.user.login,
            state: pr.state,
            createdAt: new Date(pr.created_at),
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            additions: pr.additions ?? 0,
            deletions: pr.deletions ?? 0,
            cycleTimeHrs,
          },
        })
        totalPRs++
      }
    }

    // Sync Deployments (GitHub Releases)
    const releases = await getDeployments(org.githubAccessToken, repo.full_name)
    if (Array.isArray(releases)) {
      for (const release of releases) {
        await prisma.deployment.upsert({
          where: { repoId_githubReleaseId: { repoId: dbRepo.id, githubReleaseId: release.id } },
          update: {},
          create: {
            repoId: dbRepo.id,
            githubReleaseId: release.id,
            environment: 'production',
            status: release.prerelease ? 'failure' : 'success',
            deployedAt: new Date(release.published_at ?? release.created_at),
          },
        })
        totalDeploys++
      }
    }
  }

  return NextResponse.json({ success: true, totalPRs, totalDeploys })
}