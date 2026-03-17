import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if already invited
  const existing = await prisma.invite.findFirst({
    where: { orgId: org.id, email, accepted: false },
  })
  if (existing) return NextResponse.json({ error: 'Already invited' }, { status: 400 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await prisma.invite.create({
    data: {
      orgId: org.id,
      email,
      role: role ?? 'member',
      expiresAt,
    },
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`

  return NextResponse.json({ success: true, inviteUrl, token: invite.token })
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inviteId } = await req.json()

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.invite.deleteMany({
    where: { id: inviteId, orgId: org.id },
  })

  return NextResponse.json({ success: true })
}