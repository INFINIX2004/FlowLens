import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find your org
  const org = await prisma.organization.findFirst()
  if (!org) throw new Error('No org found - connect GitHub first')

  // Find or create a test repo
  const repo = await prisma.repository.upsert({
    where: { githubId: 999999999 },
    update: {},
    create: {
      githubId: 999999999,
      name: 'test-repo',
      fullName: 'INFINIX2004/test-repo',
      orgId: org.id,
    },
  })

  // Seed PRs with realistic cycle times
  const now = new Date()
  for (let i = 0; i < 20; i++) {
    const createdAt = new Date(now.getTime() - (i + 1) * 3 * 24 * 60 * 60 * 1000)
    const mergedAt = new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
    const cycleTimeHrs = (mergedAt.getTime() - createdAt.getTime()) / 1000 / 60 / 60

    await prisma.pullRequest.upsert({
      where: { repoId_githubPrId: { repoId: repo.id, githubPrId: 1000 + i } },
      update: {},
      create: {
        githubPrId: 1000 + i,
        repoId: repo.id,
        title: `feat: feature ${i + 1}`,
        authorLogin: 'INFINIX2004',
        state: 'closed',
        createdAt,
        mergedAt,
        cycleTimeHrs,
        additions: Math.floor(Math.random() * 200),
        deletions: Math.floor(Math.random() * 50),
      },
    })
  }

  // Seed deployments
  for (let i = 0; i < 12; i++) {
    const deployedAt = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000)
    await prisma.deployment.upsert({
      where: { repoId_githubReleaseId: { repoId: repo.id, githubReleaseId: 2000 + i } },
      update: {},
      create: {
        repoId: repo.id,
        githubReleaseId: 2000 + i,
        environment: 'production',
        status: i % 5 === 0 ? 'failure' : 'success',
        deployedAt,
      },
    })
  }

  console.log('Seeded 20 PRs and 12 deployments')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())