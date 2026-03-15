import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const goals = await prisma.teamGoal.findUnique({ where: { orgId: org.id } })
  return NextResponse.json({ goals })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = await req.json()
  const goals = await prisma.teamGoal.upsert({
    where: { orgId: org.id },
    update: data,
    create: { orgId: org.id, ...data },
  })
  return NextResponse.json({ goals })
}