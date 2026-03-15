import 'dotenv/config'
import { Job, Worker } from 'bullmq'
import * as Sentry from '@sentry/nextjs'

type GithubReview = {
  submitted_at: string | null
  state: string
  user: {
    login: string
  }
}

const connection = {
  url: process.env.REDIS_URL!,
  tls: { rejectUnauthorized: false },
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

const worker = new Worker(
  'github-sync',
  async (job: Job) => {
    const { orgId } = job.data

    return await Sentry.withScope(async (scope) => {
      scope.setTag('orgId', orgId)
      scope.setContext('sync_job', { orgId, jobId: job.id })

      try {
        console.log(`[worker] Processing sync for org: ${orgId}`)

        const { prisma } = await import('../src/lib/prisma')
        const { decrypt } = await import('../src/lib/encryption')
        const {
          getGithubRepos,
          getPullRequests,
          getPRDetail,
          getPRReviews,
          getDeployments,
          getWorkflowRuns,
        } = await import('../src/lib/github')
        const { takeMetricsSnapshot } = await import('../src/lib/snapshots')

        const org = await prisma.organization.findUnique({ where: { id: orgId } })
        if (!org?.githubAccessToken) throw new Error('No GitHub token')
        const accessToken = decrypt(org.githubAccessToken)

        await prisma.syncJob.updateMany({
          where: { orgId, status: 'pending' },
          data: { status: 'running', startedAt: new Date() },
        })

        const repos = await getGithubRepos(accessToken)
        let totalPRs = 0
        let totalDeploys = 0

        function hrs(a: Date, b: Date) {
          return (b.getTime() - a.getTime()) / 1000 / 60 / 60
        }

        for (const [index, repo] of repos.slice(0, 10).entries()) {
          await job.updateProgress(Math.round((index / repos.length) * 100))

          const existingRepo = await prisma.repository.findUnique({
            where: { githubId: repo.id },
          })
          const lastSyncedAt = existingRepo?.lastSyncedAt ?? undefined

          if (lastSyncedAt) {
            console.log(`[worker] Incremental sync for ${repo.full_name} since ${lastSyncedAt.toISOString()}`)
          } else {
            console.log(`[worker] Full sync for ${repo.full_name}`)
          }

          const dbRepo = await prisma.repository.upsert({
            where: { githubId: repo.id },
            update: {
              name: repo.name,
              fullName: repo.full_name,
              lastSyncedAt: new Date(),
            },
            create: {
              githubId: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              orgId: org.id,
              lastSyncedAt: new Date(),
            },
          })

          const prs = await getPullRequests(accessToken, repo.full_name, lastSyncedAt)
          if (Array.isArray(prs)) {
            for (const pr of prs.slice(0, 30)) {
              const detail = await getPRDetail(accessToken, repo.full_name, pr.number)
              const reviewsData = await getPRReviews(accessToken, repo.full_name, pr.number)
              const reviews: GithubReview[] = Array.isArray(reviewsData) ? reviewsData : []

              const createdAt = new Date(pr.created_at)
              const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null
              const firstReview = reviews.length > 0
                ? [...reviews].sort((a, b) => new Date(a.submitted_at ?? 0).getTime() - new Date(b.submitted_at ?? 0).getTime())[0]
                : null
              const firstReviewAt = firstReview?.submitted_at ? new Date(firstReview.submitted_at) : null
              const firstApproval = reviews.find((review) => review.state === 'APPROVED') ?? null
              const approvedAt = firstApproval?.submitted_at ? new Date(firstApproval.submitted_at) : null

              const cycleTimeHrs = mergedAt ? hrs(createdAt, mergedAt) : null
              const codingTimeHrs = firstReviewAt ? hrs(createdAt, firstReviewAt) : null
              const reviewWaitHrs = firstReviewAt ? hrs(createdAt, firstReviewAt) : null
              const reviewTimeHrs = firstReviewAt && mergedAt ? hrs(firstReviewAt, mergedAt) : null
              const mergeDelayHrs = approvedAt && mergedAt ? hrs(approvedAt, mergedAt) : null

              const dbPR = await prisma.pullRequest.upsert({
                where: { repoId_githubPrId: { repoId: dbRepo.id, githubPrId: pr.number } },
                update: {
                  cycleTimeHrs,
                  codingTimeHrs,
                  reviewWaitHrs,
                  reviewTimeHrs,
                  mergeDelayHrs,
                  firstReviewAt,
                  approvedAt,
                  mergedAt,
                  additions: detail.additions ?? 0,
                  deletions: detail.deletions ?? 0,
                  changedFiles: detail.changed_files ?? 0,
                  commitCount: detail.commits ?? 0,
                  reviewCount: reviews.length,
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
                  reviewCount: reviews.length,
                  cycleTimeHrs,
                  codingTimeHrs,
                  reviewWaitHrs,
                  reviewTimeHrs,
                  mergeDelayHrs,
                },
              })

              for (const review of reviews) {
                if (!review.submitted_at) continue

                await prisma.pullRequestReview.upsert({
                  where: {
                    prId_reviewerLogin_submittedAt: {
                      prId: dbPR.id,
                      reviewerLogin: review.user.login,
                      submittedAt: new Date(review.submitted_at),
                    },
                  },
                  update: {},
                  create: {
                    prId: dbPR.id,
                    reviewerLogin: review.user.login,
                    state: review.state,
                    submittedAt: new Date(review.submitted_at),
                  },
                })
              }

              totalPRs++
            }
          }

          const releases = await getDeployments(accessToken, repo.full_name)
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

          const runs = await getWorkflowRuns(accessToken, repo.full_name, lastSyncedAt)
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

        await takeMetricsSnapshot(orgId)
        await prisma.syncJob.updateMany({
          where: { orgId, status: 'running' },
          data: { status: 'done', doneAt: new Date() },
        })

        return { totalPRs, totalDeploys }
      } catch (err) {
        Sentry.captureException(err)
        const { prisma } = await import('../src/lib/prisma')
        await prisma.syncJob.updateMany({
          where: { orgId, status: 'running' },
          data: { status: 'error', error: getErrorMessage(err), doneAt: new Date() },
        })
        throw err
      }
    })
  },
  { connection, concurrency: 3 }
)

worker.on('completed', (job) => console.log(`[worker] Job ${job.id} done`))
worker.on('failed', (job, err) => console.error(`[worker] Job ${job?.id} failed:`, err.message))

console.log('[worker] FlowLens sync worker started')
