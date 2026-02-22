/**
 * GET /api/setup/status — check system status for setup wizard.
 * Returns DB, Redis, Node, FFmpeg availability + domain detection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isSetupComplete, getSetupLock } from '@/lib/setup-check'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const setupComplete = isSetupComplete()
    const lockData = getSetupLock()

    // Detect domain from request
    const host = req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const domain = `${proto}://${host}`

    // Check Node.js version
    const nodeVersion = process.version

    // Check FFmpeg
    let ffmpegAvailable = false
    try {
        await execAsync('ffmpeg -version', { timeout: 5000 })
        ffmpegAvailable = true
    } catch {
        ffmpegAvailable = false
    }

    // Check DB connection
    let dbConnected = false
    try {
        const { prisma } = await import('@/lib/prisma')
        await prisma.$queryRaw`SELECT 1`
        dbConnected = true
    } catch {
        dbConnected = false
    }

    // Check Redis connection
    let redisConnected = false
    try {
        const Redis = (await import('ioredis')).default
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            connectTimeout: 3000,
            lazyConnect: true,
        })
        await redis.connect()
        await redis.ping()
        redisConnected = true
        await redis.quit()
    } catch {
        redisConnected = false
    }

    // Check if admin exists
    let hasAdmin = false
    if (dbConnected) {
        try {
            const { prisma } = await import('@/lib/prisma')
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
            hasAdmin = !!admin
        } catch {
            hasAdmin = false
        }
    }

    return NextResponse.json({
        isComplete: setupComplete,
        lockData,
        domain,
        nodeVersion,
        ffmpegAvailable,
        dbConnected,
        redisConnected,
        hasAdmin,
    })
}
