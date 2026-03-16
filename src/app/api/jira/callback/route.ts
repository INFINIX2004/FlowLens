import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    console.error('[jira] OAuth error or missing code:', error)
    return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
  }

  try {
    // Step 1 — Exchange code for tokens
    const tokenRes = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.JIRA_CLIENT_ID!,
        client_secret: process.env.JIRA_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.JIRA_REDIRECT_URI!,
      }),
    })

    // Check token response is OK
    if (!tokenRes.ok) {
      console.error('[jira] Token exchange failed with status:', tokenRes.status)
      return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
    }

    const tokens = await tokenRes.json()

    // Check access token exists
    if (!tokens.access_token) {
      console.error('[jira] No access token in response:', tokens)
      return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
    }

    // Step 2 — Get accessible Jira sites
    const resourceRes = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      }
    )

    // Check resources response is OK
    if (!resourceRes.ok) {
      console.error('[jira] Resources fetch failed with status:', resourceRes.status)
      return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
    }

    const resources = await resourceRes.json()

    // Check at least one site exists
    if (!Array.isArray(resources) || resources.length === 0) {
      console.error('[jira] No accessible Jira sites found')
      return NextResponse.redirect(new URL('/dashboard?jira=no-site', req.url))
    }

    const site = resources[0]

    // Verify site has required fields
    if (!site?.id || !site?.url) {
      console.error('[jira] Site missing id or url:', site)
      return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
    }

    // Step 3 — Find org and save config
    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: userId },
    })

    if (!org) {
      console.error('[jira] Org not found for userId:', userId)
      return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
    }

    await prisma.jiraConfig.upsert({
      where: { orgId: org.id },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token ?? 'none'),
        cloudId: site.id,
        siteUrl: site.url,
      },
      create: {
        orgId: org.id,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token ?? 'none'),
        cloudId: site.id,
        siteUrl: site.url,
      },
    })

    return NextResponse.redirect(new URL('/dashboard/jira?connected=true', req.url))

  } catch (err) {
    console.error('[jira] Unexpected callback error:', err)
    return NextResponse.redirect(new URL('/dashboard?jira=error', req.url))
  }
}