/**
 * Worker process entry point.
 * Run with: npx tsx src/server.ts
 *
 * This process runs alongside Next.js (managed by pm2).
 * It starts all BullMQ workers + the scheduler.
 */

// Load .env FIRST — this process runs outside Next.js so env vars aren't auto-loaded
import 'dotenv/config'

import { startAutoPostWorker } from '@/lib/workers/auto-post.worker'
import { startWebhookWorker } from '@/lib/workers/webhook.worker'
import { startGdriveWorker } from '@/lib/workers/gdrive.worker'
import { startAiContentWorker } from '@/lib/workers/ai-content.worker'
import { startScheduler, stopScheduler } from '@/lib/scheduler'

console.log('='.repeat(50))
console.log('  ASocial Worker Process')
console.log(`  Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`)
console.log(`  App:   ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`)
console.log('='.repeat(50))

// Start all workers
const workers = [
    startAutoPostWorker(),
    startWebhookWorker(),
    startGdriveWorker(),
    startAiContentWorker(),
]

// Start the scheduler
startScheduler()

// Graceful shutdown
async function shutdown(signal: string) {
    console.log(`\n[Worker] Received ${signal} — shutting down gracefully...`)
    stopScheduler()
    await Promise.all(workers.map(w => w.close()))
    console.log('[Worker] All workers stopped. Goodbye.')
    process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('uncaughtException', (err) => {
    console.error('[Worker] Uncaught exception:', err)
    shutdown('uncaughtException')
})
