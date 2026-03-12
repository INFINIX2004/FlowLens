import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const code = request.nextUrl.searchParams.get('code')
  if (!code) redirect('/dashboard?error=no_code')

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token
  if (!accessToken) redirect('/dashboard?error=token_failed')

  // Fetch GitHub user info
  const githubUser = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.json())

  // Upsert org + store token
  await prisma.organization.upsert({
    where: { clerkOrgId: userId },
    update: { githubAccessToken: accessToken, githubLogin: githubUser.login },
    create: {
      clerkOrgId: userId,
      name: githubUser.login,
      githubAccessToken: accessToken,
      githubLogin: githubUser.login,
    },
  })

  redirect('/dashboard?connected=true')
}