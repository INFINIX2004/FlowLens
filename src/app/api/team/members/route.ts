import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: userId },
    include: {
      members: { orderBy: { createdAt: 'asc' } },
      invites: {
        where: { accepted: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!org) return NextResponse.json({ members: [], invites: [] })

  return NextResponse.json({
    members: org.members,
    invites: org.invites,
    orgName: org.name,
  })
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await req.json()

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only owner can remove members
  const requester = await prisma.member.findFirst({
    where: { clerkUserId: userId, orgId: org.id },
  })
  if (requester?.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 })
  }

  await prisma.member.delete({ where: { id: memberId } })
  return NextResponse.json({ success: true })
}