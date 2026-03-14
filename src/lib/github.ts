export async function getGithubRepos(accessToken: string) {
  const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
  })
  return res.json()
}

export async function getPullRequests(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/pulls?state=all&per_page=100&sort=updated`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  )
  return res.json()
}

export async function getPRDetail(accessToken: string, fullName: string, prNumber: number) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/pulls/${prNumber}`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  )
  return res.json()
}

export async function getPRReviews(accessToken: string, fullName: string, prNumber: number) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/pulls/${prNumber}/reviews`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  )
  return res.json()
}

export async function getWorkflowRuns(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/actions/runs?per_page=50&status=completed`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  )
  return res.json()
}

export async function getDeployments(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/releases?per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  )
  return res.json()
}