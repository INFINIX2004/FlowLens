import { createSyncWorker } from '@/lib/queue'
import { NextResponse } from 'next/server'

let workerStarted = false

export async function GET() {
  if (!workerStarted) {
    createSyncWorker()
    workerStarted = true
    console.log('Worker started')
  }
  return NextResponse.json({ status: 'worker running' })
}