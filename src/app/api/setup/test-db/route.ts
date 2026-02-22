/**
 * POST /api/setup/test-db — test a PostgreSQL connection with user-provided credentials.
 * Also tests Redis connection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isSetupComplete } from '@/lib/setup-check'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    if (isSetupComplete()) {
        return NextResponse.json({ error: 'Setup already complete' }, { status: 403 })
    }

    const body = await req.json()
    const { dbHost, dbPort, dbName, dbUser, dbPassword, redisUrl } = body

    const results: Record<string, { connected: boolean; error?: string }> = {}

    // Test PostgreSQL
    const databaseUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=public`
    try {
        const { Client } = await import('pg')
        const client = new Client({ connectionString: databaseUrl })
        await client.connect()
        await client.query('SELECT 1')
        await client.end()
        results.database = { connected: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed'
        results.database = { connected: false, error: msg }
    }

    // Test Redis
    try {
        const Redis = (await import('ioredis')).default
        const redis = new Redis(redisUrl || 'redis://localhost:6379', {
            connectTimeout: 3000,
            lazyConnect: true,
        })
        await redis.connect()
        await redis.ping()
        await redis.quit()
        results.redis = { connected: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed'
        results.redis = { connected: false, error: msg }
    }

    return NextResponse.json({
        results,
        generatedDatabaseUrl: results.database.connected ? databaseUrl : undefined,
    })
}
