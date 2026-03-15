import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type {
  ActivityDeployment,
  ActivityPullRequest,
  RepositoryWithActivity,
} from '@/lib/repository-activity-types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: userId } })
  if (!org) return NextResponse.json({ error: 'No org' }, { status: 404 })

  const repos: RepositoryWithActivity[] = await prisma.repository.findMany({
    where: { orgId: org.id },
    include: {
      pullRequests: { where: { mergedAt: { not: null } }, orderBy: { mergedAt: 'desc' }, take: 20 },
      deployments: { orderBy: { deployedAt: 'desc' }, take: 20 },
    },
  })

  const allPRs: ActivityPullRequest[] = repos.flatMap(r => r.pullRequests)
  const allDeploys: ActivityDeployment[] = repos.flatMap(r => r.deployments)
  const avgCycleTime = allPRs.length > 0
    ? allPRs.reduce((s: number, p) => s + (p.cycleTimeHrs ?? 0), 0) / allPRs.length : 0
  const failedDeploys = allDeploys.filter(d => d.status === 'failure').length
  const failureRate = allDeploys.length > 0 ? (failedDeploys / allDeploys.length) * 100 : 0

  const prompt = `You are an engineering analytics assistant. Write a brief sprint retrospective (under 200 words) based on:
- Team: ${org.name}
- Merged PRs: ${allPRs.length}
- Avg cycle time: ${Math.round(avgCycleTime * 10) / 10}h
- Deployments: ${allDeploys.length}, failures: ${failedDeploys} (${Math.round(failureRate)}%)
- Authors: ${[...new Set(allPRs.map(p => p.authorLogin))].slice(0, 3).join(', ')}

3 sections: What went well, Areas to improve, Recommendations. Use markdown bullets.`

  // Try Groq first
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('Trying Groq...')
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const res = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = res.choices[0].message.content ?? ''
      return NextResponse.json({ retrospective: text, provider: 'groq' })
    } catch (e: unknown) {
      console.warn('Groq failed:', getErrorMessage(e))
      Sentry.captureException(e, { tags: { provider: 'groq' } })
    }
  }

  // Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('Trying Gemini...')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return NextResponse.json({ retrospective: text, provider: 'gemini' })
    } catch (e: unknown) {
      console.warn('Gemini failed:', getErrorMessage(e))
      Sentry.captureException(e, { tags: { provider: 'gemini' } })
    }
  }

  // Try Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Trying Anthropic...')
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return NextResponse.json({ retrospective: text, provider: 'anthropic' })
    } catch (e: unknown) {
      console.warn('Anthropic failed:', getErrorMessage(e))
      Sentry.captureException(e, { tags: { provider: 'anthropic' } })
    }
  }

  return NextResponse.json({ error: 'All AI providers failed.' }, { status: 500 })
}
