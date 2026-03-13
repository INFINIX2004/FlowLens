export async function getGithubRepos(accessToken: string) {
  const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  })
  return res.json()
}

export async function getPullRequests(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/pulls?state=all&per_page=100&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )
  return res.json()
}

export async function getDeployments(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/releases?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )
  return res.json()
}