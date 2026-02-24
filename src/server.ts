/**
 * Worker process entry point.
 * Run with: npx tsx src/server.ts
 *
 * This process runs alongside Next.js (managed by pm2).
 * It starts all BullMQ workers + the scheduler.
 *
 * IMPORTANT: We use dotenv.config() synchronously BEFORE dynamic imports
 * so that DATABASE_URL and other env vars are available when modules load.
 * (Static `import 'dotenv/config'` gets hoisted in ESM and may run
 *  in parallel with other imports, causing race conditions.)
 */

import { config as dotenvConfig } from 'dotenv'

// ─── Load .env FIRST (synchronous, before anything else) ─────────
dotenvConfig()

async function main() {
    // Dynamic imports — these only run AFTER dotenv has loaded
    const { startAutoPostWorker } = await import('@/lib/workers/auto-post.worker')
    const { startWebhookWorker } = await import('@/lib/workers/webhook.worker')
    const { startGdriveWorker } = await import('@/lib/workers/gdrive.worker')
    const { startAiContentWorker } = await import('@/lib/workers/ai-content.worker')
    const { startScheduler, stopScheduler } = await import('@/lib/scheduler')

    console.log('='.repeat(50))
    console.log('  Worker Process')
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
}

main().catch(err => {
    console.error('[Worker] Fatal error during startup:', err)
    process.exit(1)
})

