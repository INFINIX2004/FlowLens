'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#080B0F] text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠</p>
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">This error has been reported automatically.</p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-lg transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}