import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGithubRepos, getPullRequests, getPRDetail, getPRReviews, getDeployments, getWorkflowRuns } from '@/lib/github'
import { NextResponse } from 'next/server'

function hrs(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 1000 / 60 / 60
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org?.githubAccessToken) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })

  // Create sync job record
  const job = await prisma.syncJob.create({
    data: { orgId: org.id, status: 'running', startedAt: new Date() }
  })

  try {
    const repos = await getGithubRepos(org.githubAccessToken)
    let totalPRs = 0
    let totalDeploys = 0

    for (const repo of repos.slice(0, 10)) {
      const dbRepo = await prisma.repository.upsert({
        where: { githubId: repo.id },
        update: { name: repo.name, fullName: repo.full_name, lastSyncedAt: new Date() },
        create: { githubId: repo.id, name: repo.name, fullName: repo.full_name, orgId: org.id, lastSyncedAt: new Date() },
      })

      // Sync PRs with reviews and cycle time stages
      const prs = await getPullRequests(org.githubAccessToken, repo.full_name)
      if (Array.isArray(prs)) {
        for (const pr of prs.slice(0, 30)) {
          // Get PR detail for extra fields
          const detail = await getPRDetail(org.githubAccessToken, repo.full_name, pr.number)
          
          // Get reviews
          const reviews = await getPRReviews(org.githubAccessToken, repo.full_name, pr.number)
          
          const createdAt = new Date(pr.created_at)
          const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null

          // First review submitted
          const firstReview = Array.isArray(reviews) && reviews.length > 0
            ? reviews.sort((a: any, b: any) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())[0]
            : null
          const firstReviewAt = firstReview ? new Date(firstReview.submitted_at) : null

          // First approval
          const firstApproval = Array.isArray(reviews)
            ? reviews.find((r: any) => r.state === 'APPROVED')
            : null
          const approvedAt = firstApproval ? new Date(firstApproval.submitted_at) : null

          // Compute cycle time stages
          const cycleTimeHrs = mergedAt ? hrs(createdAt, mergedAt) : null
          const codingTimeHrs = firstReviewAt ? hrs(createdAt, firstReviewAt) : null
          const reviewWaitHrs = firstReviewAt && firstReviewAt ? hrs(createdAt, firstReviewAt) : null
          const reviewTimeHrs = firstReviewAt && mergedAt ? hrs(firstReviewAt, mergedAt) : null
          const mergeDelayHrs = approvedAt && mergedAt ? hrs(approvedAt, mergedAt) : null

          const dbPR = await prisma.pullRequest.upsert({
            where: { repoId_githubPrId: { repoId: dbRepo.id, githubPrId: pr.number } },
            update: {
              cycleTimeHrs, codingTimeHrs, reviewWaitHrs, reviewTimeHrs, mergeDelayHrs,
              firstReviewAt, approvedAt, mergedAt,
              additions: detail.additions ?? 0,
              deletions: detail.deletions ?? 0,
              changedFiles: detail.changed_files ?? 0,
              commitCount: detail.commits ?? 0,
              reviewCount: Array.isArray(reviews) ? reviews.length : 0,
            },
            create: {
              githubPrId: pr.number,
              repoId: dbRepo.id,
              title: pr.title,
              authorLogin: pr.user.login,
              state: pr.state,
              createdAt,
              mergedAt,
              firstReviewAt,
              approvedAt,
              additions: detail.additions ?? 0,
              deletions: detail.deletions ?? 0,
              changedFiles: detail.changed_files ?? 0,
              commitCount: detail.commits ?? 0,
              reviewCount: Array.isArray(reviews) ? reviews.length : 0,
              cycleTimeHrs,
              codingTimeHrs,
              reviewWaitHrs,
              reviewTimeHrs,
              mergeDelayHrs,
            },
          })

          // Store individual reviews
          if (Array.isArray(reviews)) {
            for (const review of reviews) {
              if (!review.submitted_at) continue
              await prisma.pullRequestReview.upsert({
                where: { prId_reviewerLogin_submittedAt: { 
                  prId: dbPR.id, 
                  reviewerLogin: review.user.login,
                  submittedAt: new Date(review.submitted_at)
                }},
                update: {},
                create: {
                  prId: dbPR.id,
                  reviewerLogin: review.user.login,
                  state: review.state,
                  submittedAt: new Date(review.submitted_at),
                },
              })
            }
          }
          totalPRs++
        }
      }

      // Sync deployments from releases
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

      // Sync workflow runs as deployments
      const runs = await getWorkflowRuns(org.githubAccessToken, repo.full_name)
      if (runs?.workflow_runs && Array.isArray(runs.workflow_runs)) {
        for (const run of runs.workflow_runs.slice(0, 20)) {
          if (run.name?.toLowerCase().includes('deploy') || run.name?.toLowerCase().includes('release')) {
            await prisma.deployment.upsert({
              where: { repoId_githubReleaseId: { repoId: dbRepo.id, githubReleaseId: run.id } },
              update: {},
              create: {
                repoId: dbRepo.id,
                githubReleaseId: run.id,
                environment: 'production',
                status: run.conclusion === 'success' ? 'success' : 'failure',
                deployedAt: new Date(run.created_at),
              },
            })
            totalDeploys++
          }
        }
      }
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: 'done', doneAt: new Date() }
    })

    return NextResponse.json({ success: true, totalPRs, totalDeploys })

  } catch (err: any) {
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: 'error', error: err.message, doneAt: new Date() }
    })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}