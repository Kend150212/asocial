/**
 * Channel Owner Key Resolution
 *
 * Design: API keys are BYOK per channel owner.
 * - The Owner of a channel provides the API key used by all members (staff, manager).
 * - No admin API Hub fallback for regular users.
 * - Quota is checked against the Owner's subscription plan.
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

export interface OwnerKeyResult {
    /** null means no key found or no owner found */
    apiKey: string | null
    provider: string | null
    model: string | null
    /** The userId of the channel owner */
    ownerId: string | null
    /** Whether the owner exists but has no API key configured */
    ownerHasNoKey: boolean
    /** Error message suitable to show the user */
    error: string | null
}

/**
 * Given a channelId, finds the channel OWNER and returns their active API key.
 * Staff and managers in the channel share the owner's key.
 *
 * Priority:
 * 1. Owner's key matching `preferredProvider` (if specified)
 * 2. Owner's default key
 * 3. Owner's first active key
 */
export async function getChannelOwnerKey(
    channelId: string,
    preferredProvider?: string | null
): Promise<OwnerKeyResult> {
    // Find the OWNER member of this channel
    const ownerMember = await prisma.channelMember.findFirst({
        where: { channelId, role: 'OWNER' },
        select: { userId: true },
    })

    if (!ownerMember) {
        return {
            apiKey: null,
            provider: null,
            model: null,
            ownerId: null,
            ownerHasNoKey: false,
            error: 'Channel has no owner configured.',
        }
    }

    const ownerId = ownerMember.userId

    // Try preferred provider first
    let keyRecord: { apiKeyEncrypted: string; provider: string; defaultModel: string | null } | null = null

    if (preferredProvider) {
        keyRecord = await prisma.userApiKey.findFirst({
            where: { userId: ownerId, provider: preferredProvider, isActive: true },
            select: { apiKeyEncrypted: true, provider: true, defaultModel: true },
        })
    }

    // Fallback: default key
    if (!keyRecord) {
        keyRecord = await prisma.userApiKey.findFirst({
            where: { userId: ownerId, isDefault: true, isActive: true },
            select: { apiKeyEncrypted: true, provider: true, defaultModel: true },
        })
    }

    // Fallback: any active key
    if (!keyRecord) {
        keyRecord = await prisma.userApiKey.findFirst({
            where: { userId: ownerId, isActive: true },
            select: { apiKeyEncrypted: true, provider: true, defaultModel: true },
        })
    }

    if (!keyRecord) {
        return {
            apiKey: null,
            provider: null,
            model: null,
            ownerId,
            ownerHasNoKey: true,
            error: 'The channel owner has not configured an AI API key. Please ask the channel owner to add their API key in AI API Keys settings.',
        }
    }

    return {
        apiKey: decrypt(keyRecord.apiKeyEncrypted),
        provider: keyRecord.provider,
        model: keyRecord.defaultModel,
        ownerId,
        ownerHasNoKey: false,
        error: null,
    }
}

/**
 * Get the channel owner's userId for quota/plan checks.
 */
export async function getChannelOwnerId(channelId: string): Promise<string | null> {
    const member = await prisma.channelMember.findFirst({
        where: { channelId, role: 'OWNER' },
        select: { userId: true },
    })
    return member?.userId ?? null
}
