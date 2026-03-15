import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDORAMetrics } from '@/lib/metrics'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({})

  return NextResponse.json(await getDORAMetrics(org.id))
}
