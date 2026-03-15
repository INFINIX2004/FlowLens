import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncQueue } from '@/lib/queue'
import { NextResponse } from 'next/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org?.githubAccessToken) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })

  const job = await prisma.syncJob.create({
    data: { orgId: org.id, status: 'pending' },
  })

  await syncQueue.add('sync', { orgId: org.id }, {
    jobId: job.id,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  })

  return NextResponse.json({ success: true, jobId: job.id, message: 'Sync started in background' })
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'No jobId' }, { status: 400 })

  const job = await prisma.syncJob.findUnique({ where: { id: jobId } })
  return NextResponse.json({ status: job?.status, error: job?.error })
}
