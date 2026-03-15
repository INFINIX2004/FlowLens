import { Queue } from 'bullmq'

const connection = {
  url: process.env.REDIS_URL!,
  tls: { rejectUnauthorized: false },
}

export const syncQueue = new Queue('github-sync', { connection })
