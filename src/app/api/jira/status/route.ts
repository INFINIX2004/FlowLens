
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ connected: false })
  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ connected: false })
  const config = await prisma.jiraConfig.findUnique({ where: { orgId: org.id } })
  return NextResponse.json({ connected: !!config, siteUrl: config?.siteUrl })
}