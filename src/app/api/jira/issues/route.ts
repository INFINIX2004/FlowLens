import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getJiraIssues } from '@/lib/jira'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const project = req.nextUrl.searchParams.get('project') ?? ''
  const issues = await getJiraIssues(org.id, project)
  return NextResponse.json({ issues })
}