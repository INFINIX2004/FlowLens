import { WebClient } from '@slack/web-api'
import { prisma } from './prisma'
import { decrypt } from './encryption'

export async function notifySlack(
  orgId: string,
  event: 'pr_merged' | 'cycle_time_exceeded' | 'daily_digest',
  payload: Record<string, unknown>
) {
  try {
    const config = await prisma.slackConfig.findUnique({ where: { orgId } })
    if (!config || !config.events.includes(event)) return

    const slack = new WebClient(decrypt(config.botToken))

    await slack.chat.postMessage({
      channel: config.channel,
      text: buildText(event, payload),
      blocks: buildBlocks(event, payload),
    })
  } catch (err) {
    // Don't crash the sync if Slack fails
    console.error('[slack] notification failed:', err)
  }
}

function buildText(event: string, payload: Record<string, unknown>): string {
  if (event === 'pr_merged') return `PR Merged: ${payload.title}`
  if (event === 'cycle_time_exceeded') return `Cycle time exceeded for ${payload.prTitle}`
  return 'FlowLens Daily Digest'
}

function buildBlocks(event: string, payload: Record<string, unknown>) {
  if (event === 'pr_merged') {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*PR Merged:* <${payload.url}|${payload.title}>\nBy *${payload.author}* | Cycle time: *${payload.cycleTime}h*`,
        },
      },
    ]
  }

  if (event === 'cycle_time_exceeded') {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Cycle time exceeded target*\n<${payload.url}|${payload.prTitle}>\nActual: *${payload.actual}h* -> Target: *${payload.target}h*`,
        },
      },
    ]
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*FlowLens Daily Digest*\nPRs merged today: *${payload.merged}* | Avg cycle time: *${payload.avgCycleTime}h*`,
      },
    },
  ]
}
