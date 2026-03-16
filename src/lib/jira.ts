import { prisma } from './prisma'
import { decrypt } from './encryption'

export async function getJiraIssues(orgId: string, projectKey: string) {
  const config = await prisma.jiraConfig.findUnique({ where: { orgId } })
  if (!config) throw new Error('Jira not connected')

  const token = decrypt(config.accessToken)
  const res = await fetch(
    `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/3/search?jql=project=${projectKey} ORDER BY created DESC&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  )
  const data = await res.json()
  return data.issues ?? []
}

export async function linkJiraIssuesToPRs(orgId: string) {
  // Find PRs whose titles/branches mention Jira keys like ENG-123
  const prs = await prisma.pullRequest.findMany({
    where: { repo: { orgId } },
    select: { id: true, title: true },
  })

  const jiraKeyRegex = /([A-Z]+-\d+)/g

  for (const pr of prs) {
    const keys = pr.title.match(jiraKeyRegex) ?? []
    for (const key of keys) {
      await prisma.jiraIssue.upsert({
        where: { jiraKey: key },
        update: { prIds: { push: pr.id } },
        create: {
          orgId,
          jiraKey: key,
          summary: '',
          status: 'unknown',
          issueType: 'unknown',
          createdAt: new Date(),
          prIds: [pr.id],
        },
      })
    }
  }
}