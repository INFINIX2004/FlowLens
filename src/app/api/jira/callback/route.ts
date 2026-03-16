import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect('/dashboard?jira=error')

  // Exchange code for token
  const tokenRes = await fetch('https://auth.atlassian.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.JIRA_CLIENT_ID,
      client_secret: process.env.JIRA_CLIENT_SECRET,
      code,
      redirect_uri: process.env.JIRA_REDIRECT_URI,
    }),
  })
  const tokens = await tokenRes.json()

  // Get accessible resources (cloud ID)
  const resourceRes = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
  })
  const resources = await resourceRes.json()
  const site = resources[0]

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.redirect('/dashboard?jira=error')

  await prisma.jiraConfig.upsert({
    where: { orgId: org.id },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      cloudId: site.id,
      siteUrl: site.url,
    },
    create: {
      orgId: org.id,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      cloudId: site.id,
      siteUrl: site.url,
    },
  })

  return NextResponse.redirect('/dashboard?jira=connected')
}