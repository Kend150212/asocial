/**
 * Setup Check — detects if ASocial has been configured.
 * Uses a lock file (data/setup-lock.json) to persist setup state.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const LOCK_FILE = join(DATA_DIR, 'setup-lock.json')

export interface SetupLockData {
    completedAt: string
    domain: string
    adminEmail: string
    version: string
}

/**
 * Check if setup has been completed.
 */
export function isSetupComplete(): boolean {
    return existsSync(LOCK_FILE)
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
