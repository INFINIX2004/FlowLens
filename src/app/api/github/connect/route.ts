import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    scope: 'repo read:org read:user',
    redirect_uri: 'http://localhost:3000/api/github/callback',
  })

  redirect(`https://github.com/login/oauth/authorize?${params}`)
}