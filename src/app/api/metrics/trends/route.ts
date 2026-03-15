import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type LeadTimeTrendPoint = {
  date: string
  hours: number
}

type DeployFrequencyPoint = {
  week: string
  deployments: number
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { clerkOrgId: userId },
  })
  if (!org) return NextResponse.json({ error: 'No org' }, { status: 404 })

  const repos = await prisma.repository.findMany({
    where: { orgId: org.id },
    include: {
      pullRequests: { where: { mergedAt: { not: null } }, orderBy: { mergedAt: 'asc' } },
      deployments: { orderBy: { deployedAt: 'asc' } },
    },
  })

  const allPRs = repos.flatMap(r => r.pullRequests)
  const allDeploys = repos.flatMap(r => r.deployments)

  // Lead time trend — group by day
  const leadTimeTrend = allPRs.reduce<LeadTimeTrendPoint[]>((acc, pr) => {
    const date = pr.mergedAt!.toISOString().slice(0, 10)
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing.hours = Math.round((existing.hours + (pr.cycleTimeHrs ?? 0)) / 2 * 10) / 10
    } else {
      acc.push({ date, hours: Math.round((pr.cycleTimeHrs ?? 0) * 10) / 10 })
    }
    return acc
  }, []).slice(-14)

  // Deploy frequency — group by week
  const deployFrequency = allDeploys.reduce<DeployFrequencyPoint[]>((acc, d) => {
    const week = `W${getWeekNumber(d.deployedAt)}`
    const existing = acc.find(w => w.week === week)
    if (existing) existing.deployments++
    else acc.push({ week, deployments: 1 })
    return acc
  }, []).slice(-8)

  // Cycle time distribution
  const cycleTimeDistribution = [
    { range: '<4h', count: allPRs.filter(p => (p.cycleTimeHrs ?? 0) < 4).length },
    { range: '4-12h', count: allPRs.filter(p => (p.cycleTimeHrs ?? 0) >= 4 && (p.cycleTimeHrs ?? 0) < 12).length },
    { range: '12-24h', count: allPRs.filter(p => (p.cycleTimeHrs ?? 0) >= 12 && (p.cycleTimeHrs ?? 0) < 24).length },
    { range: '24-48h', count: allPRs.filter(p => (p.cycleTimeHrs ?? 0) >= 24 && (p.cycleTimeHrs ?? 0) < 48).length },
    { range: '>48h', count: allPRs.filter(p => (p.cycleTimeHrs ?? 0) >= 48).length },
  ]

  // Failure rate trend by week
  const failureRateTrend = deployFrequency.map(w => {
    const weekDeploys = allDeploys.filter(d => `W${getWeekNumber(d.deployedAt)}` === w.week)
    const failed = weekDeploys.filter(d => d.status === 'failure').length
    return {
      week: w.week,
      rate: weekDeploys.length > 0 ? Math.round((failed / weekDeploys.length) * 100) : 0,
    }
  })

  return NextResponse.json({ leadTimeTrend, deployFrequency, cycleTimeDistribution, failureRateTrend })
}

function getWeekNumber(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}
