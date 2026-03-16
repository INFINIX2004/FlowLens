import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: process.env.JIRA_CLIENT_ID!,
    scope: 'read:jira-data read:jira-work offline_access',
    redirect_uri: process.env.JIRA_REDIRECT_URI!,
    state: 'jira-oauth',
    response_type: 'code',
    prompt: 'consent',
  })
  return NextResponse.redirect(`https://auth.atlassian.com/authorize?${params}`)
}