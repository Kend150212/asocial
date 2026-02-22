/**
 * Setup Check — detects if ASocial/NeeFlow has been configured.
 * Uses a lock file (data/setup-lock.json) to persist setup state.
 * Also auto-detects existing .env with DATABASE_URL to avoid
 * breaking already-deployed instances on code upgrade.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const LOCK_FILE = join(DATA_DIR, 'setup-lock.json')
const ENV_FILE = join(process.cwd(), '.env')

export interface SetupLockData {
    completedAt: string
    domain: string
    adminEmail: string
    version: string
}

/**
 * Check if setup has been completed.
 * 1. If lock file exists → setup is done.
 * 2. If no lock file but .env has DATABASE_URL → existing deploy,
 *    auto-create lock file and treat as done.
 * 3. Otherwise → needs setup wizard.
 */
export function isSetupComplete(): boolean {
    // Fast path: lock file exists
    if (existsSync(LOCK_FILE)) return true

    // Fallback: detect existing .env with DATABASE_URL
    // This handles upgrades from pre-wizard versions
    if (existsSync(ENV_FILE)) {
        try {
            const envContent = readFileSync(ENV_FILE, 'utf-8')
            const hasDbUrl = envContent.split('\n').some(line => {
                const trimmed = line.trim()
                return !trimmed.startsWith('#') && trimmed.startsWith('DATABASE_URL=')
            })
            if (hasDbUrl) {
                // Auto-create lock file so this check is fast next time
                markSetupComplete({
                    domain: process.env.NEXTAUTH_URL || 'auto-detected',
                    adminEmail: 'pre-existing',
                })
                return true
            }
        } catch {
            // If we can't read .env, fall through to false
        }
    }

    return false
}

/**
 * Read the setup lock data (returns null if not complete).
 */
export function getSetupLock(): SetupLockData | null {
    if (!existsSync(LOCK_FILE)) return null
    try {
        const raw = readFileSync(LOCK_FILE, 'utf-8')
        return JSON.parse(raw) as SetupLockData
    } catch {
        return null
    }
}

/**
 * Mark setup as complete by writing the lock file.
 */
export function markSetupComplete(data: Omit<SetupLockData, 'completedAt' | 'version'>): void {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true })
    }

    const lockData: SetupLockData = {
        ...data,
        completedAt: new Date().toISOString(),
        version: '1.0.0',
    }

    writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2), 'utf-8')
}
