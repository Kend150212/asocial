import { prisma } from '@/lib/prisma'

export type ActivityAction =
    | 'user_login'
    | 'user_logout'
    | 'post_created'
    | 'post_updated'
    | 'post_deleted'
    | 'post_published'
    | 'post_approved'
    | 'post_rejected'
    | 'post_scheduled'
    | 'channel_created'
    | 'channel_updated'
    | 'channel_deleted'
    | 'media_uploaded'
    | 'media_deleted'
    | 'settings_changed'
    | 'plan_changed'
    | 'plan_override'
    | 'trial_granted'
    | 'trial_revoked'
    | 'integration_added'
    | 'integration_removed'
    | 'api_call'
    | 'duplicate_detected'

/**
 * Log an activity entry into the audit trail.
 * Fire-and-forget — never throws.
 */
export async function logActivity(
    userId: string,
    action: ActivityAction,
    details?: Record<string, unknown>,
    channelId?: string | null,
    ipAddress?: string | null,
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details ? JSON.parse(JSON.stringify(details)) : {},
                channelId: channelId ?? undefined,
                ipAddress: ipAddress ?? undefined,
            },
        })
    } catch {
        // Fire-and-forget — never block the main request
        console.error('[logActivity] failed to write audit log', { userId, action })
    }
}
