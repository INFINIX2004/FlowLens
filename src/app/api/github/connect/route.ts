import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const redirectUri = new URL('/api/github/callback', request.nextUrl.origin).toString()
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    scope: 'repo read:org read:user',
    redirect_uri: redirectUri,
  })

  redirect(`https://github.com/login/oauth/authorize?${params}`)
}
