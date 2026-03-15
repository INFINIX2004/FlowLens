export type ActivityPullRequest = {
  authorLogin: string
  mergedAt: Date | null
  cycleTimeHrs: number | null
  codingTimeHrs: number | null
  reviewWaitHrs: number | null
  reviewTimeHrs: number | null
  mergeDelayHrs: number | null
}

export type ActivityDeployment = {
  deployedAt: Date
  status: string
}

export type RepositoryWithActivity = {
  pullRequests: ActivityPullRequest[]
  deployments: ActivityDeployment[]
}
