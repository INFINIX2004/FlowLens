import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const config = await prisma.slackConfig.findUnique({ where: { orgId: org.id } })

  return NextResponse.json({
    config: config ? { channel: config.channel, events: config.events, connected: true } : null,
  })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { botToken, channel, events } = await req.json()
  const existingConfig = await prisma.slackConfig.findUnique({ where: { orgId: org.id } })
  const resolvedBotToken = botToken || existingConfig?.botToken

  if (!resolvedBotToken || !channel) {
    return NextResponse.json({ error: 'botToken and channel are required' }, { status: 400 })
  }

  const config = await prisma.slackConfig.upsert({
    where: { orgId: org.id },
    update: { botToken: resolvedBotToken, channel, events: events ?? [] },
    create: { orgId: org.id, botToken: resolvedBotToken, channel, events: events ?? [] },
  })

  return NextResponse.json({ success: true, channel: config.channel })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.slackConfig.deleteMany({ where: { orgId: org.id } })
  return NextResponse.json({ success: true })
}
