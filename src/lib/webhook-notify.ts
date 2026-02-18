// Webhook notification helper — sends post-publish notifications to
// Discord, Telegram, Slack, and custom webhook endpoints configured on a channel.

interface WebhookConfig {
    webhookDiscord?: { url?: string } | null
    webhookTelegram?: { botToken?: string; chatId?: string } | null
    webhookSlack?: { url?: string } | null
    webhookCustom?: { url?: string } | null
    webhookEvents?: string[] | null
}

interface PublishResult {
    platform: string
    accountId: string
    success: boolean
    error?: string
    externalId?: string
}

interface PublishNotificationData {
    postId: string
    content: string
    publishedBy: string // user name or email
    publishedAt: Date
    channelName: string
    results: PublishResult[]
    mediaCount: number
}

// Platform display names & emojis
const platformEmojis: Record<string, string> = {
    facebook: '📘 Facebook',
    instagram: '📸 Instagram',
    youtube: '🎬 YouTube',
    tiktok: '🎵 TikTok',
    pinterest: '📌 Pinterest',
    linkedin: '💼 LinkedIn',
    x: '𝕏 X (Twitter)',
}

function getPlatformLabel(platform: string): string {
    return platformEmojis[platform] || platform
}

// ─── Format message for Discord (Markdown + Embeds) ──────────────────

function buildDiscordPayload(data: PublishNotificationData) {
    const successResults = data.results.filter(r => r.success)
    const failedResults = data.results.filter(r => !r.success)

    const platformLines = successResults.map(r =>
        `✅ ${getPlatformLabel(r.platform)}`
    ).join('\n')

    const failedLines = failedResults.map(r =>
        `❌ ${getPlatformLabel(r.platform)}: ${r.error || 'Unknown error'}`
    ).join('\n')

    const truncatedContent = data.content.length > 200
        ? data.content.slice(0, 200) + '…'
        : data.content

    return {
        username: 'ASocial',
        embeds: [{
            title: '📢 Post Published',
            color: failedResults.length === 0 ? 0x22c55e : 0xf59e0b, // green or amber
            description: truncatedContent,
            fields: [
                { name: '📡 Channel', value: data.channelName, inline: true },
                { name: '👤 Published by', value: data.publishedBy, inline: true },
                { name: '🕐 Time', value: `<t:${Math.floor(data.publishedAt.getTime() / 1000)}:R>`, inline: true },
                { name: '📊 Platforms', value: platformLines || 'None', inline: false },
                ...(failedLines ? [{ name: '⚠️ Failed', value: failedLines, inline: false }] : []),
                ...(data.mediaCount > 0 ? [{ name: '📎 Media', value: `${data.mediaCount} file(s)`, inline: true }] : []),
            ],
            footer: { text: `Post ID: ${data.postId}` },
            timestamp: data.publishedAt.toISOString(),
        }],
    }
}

// ─── Format message for Telegram (HTML/Markdown) ─────────────────────

function buildTelegramMessage(data: PublishNotificationData): string {
    const successResults = data.results.filter(r => r.success)
    const failedResults = data.results.filter(r => !r.success)

    const platformLines = successResults.map(r =>
        `✅ ${getPlatformLabel(r.platform)}`
    ).join('\n')

    const failedLines = failedResults.map(r =>
        `❌ ${getPlatformLabel(r.platform)}: ${r.error || 'Unknown error'}`
    ).join('\n')

    const truncatedContent = data.content.length > 200
        ? data.content.slice(0, 200) + '…'
        : data.content

    let msg = `📢 *Post Published*\n\n`
    msg += `📝 ${truncatedContent}\n\n`
    msg += `📡 *Channel:* ${data.channelName}\n`
    msg += `👤 *Published by:* ${data.publishedBy}\n`
    msg += `🕐 *Time:* ${data.publishedAt.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`
    if (data.mediaCount > 0) msg += `📎 *Media:* ${data.mediaCount} file(s)\n`
    msg += `\n*Platforms:*\n${platformLines}`
    if (failedLines) msg += `\n\n*Failed:*\n${failedLines}`

    return msg
}

// ─── Format message for Slack (Block Kit) ────────────────────────────

function buildSlackPayload(data: PublishNotificationData) {
    const successResults = data.results.filter(r => r.success)
    const failedResults = data.results.filter(r => !r.success)

    const platformLines = successResults.map(r =>
        `✅ ${getPlatformLabel(r.platform)}`
    ).join('\n')

    const failedLines = failedResults.map(r =>
        `❌ ${getPlatformLabel(r.platform)}: ${r.error || 'Unknown error'}`
    ).join('\n')

    const truncatedContent = data.content.length > 200
        ? data.content.slice(0, 200) + '…'
        : data.content

    return {
        blocks: [
            { type: 'header', text: { type: 'plain_text', text: '📢 Post Published', emoji: true } },
            { type: 'section', text: { type: 'mrkdwn', text: truncatedContent } },
            {
                type: 'section', fields: [
                    { type: 'mrkdwn', text: `*📡 Channel:*\n${data.channelName}` },
                    { type: 'mrkdwn', text: `*👤 Published by:*\n${data.publishedBy}` },
                    { type: 'mrkdwn', text: `*🕐 Time:*\n<!date^${Math.floor(data.publishedAt.getTime() / 1000)}^{date_short_pretty} {time}|${data.publishedAt.toISOString()}>` },
                    ...(data.mediaCount > 0 ? [{ type: 'mrkdwn' as const, text: `*📎 Media:*\n${data.mediaCount} file(s)` }] : []),
                ]
            },
            { type: 'section', text: { type: 'mrkdwn', text: `*Platforms:*\n${platformLines}` } },
            ...(failedLines ? [{ type: 'section' as const, text: { type: 'mrkdwn' as const, text: `*⚠️ Failed:*\n${failedLines}` } }] : []),
            { type: 'context', elements: [{ type: 'mrkdwn', text: `Post ID: ${data.postId}` }] },
        ],
    }
}

// ─── Format message for Custom Webhook (JSON) ───────────────────────

function buildCustomPayload(data: PublishNotificationData) {
    return {
        event: 'post.published',
        source: 'asocial',
        timestamp: data.publishedAt.toISOString(),
        post: {
            id: data.postId,
            content: data.content,
            mediaCount: data.mediaCount,
        },
        channel: data.channelName,
        publishedBy: data.publishedBy,
        results: data.results.map(r => ({
            platform: r.platform,
            success: r.success,
            externalId: r.externalId || null,
            error: r.error || null,
        })),
    }
}

// ─── Main sender ─────────────────────────────────────────────────────

export async function sendPublishWebhooks(
    webhookConfig: WebhookConfig,
    data: PublishNotificationData,
): Promise<void> {
    const tasks: Promise<void>[] = []

    // Discord
    const discordUrl = (webhookConfig.webhookDiscord as Record<string, string> | null)?.url
    if (discordUrl) {
        tasks.push(
            fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildDiscordPayload(data)),
            })
                .then(res => {
                    if (!res.ok) console.warn(`[Webhook] Discord failed: ${res.status}`)
                    else console.log('[Webhook] Discord notification sent')
                })
                .catch(err => console.warn('[Webhook] Discord error:', err.message))
        )
    }

    // Telegram
    const tgConfig = webhookConfig.webhookTelegram as Record<string, string> | null
    if (tgConfig?.botToken && tgConfig?.chatId) {
        tasks.push(
            fetch(`https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: tgConfig.chatId,
                    text: buildTelegramMessage(data),
                    parse_mode: 'Markdown',
                }),
            })
                .then(res => {
                    if (!res.ok) console.warn(`[Webhook] Telegram failed: ${res.status}`)
                    else console.log('[Webhook] Telegram notification sent')
                })
                .catch(err => console.warn('[Webhook] Telegram error:', err.message))
        )
    }

    // Slack
    const slackUrl = (webhookConfig.webhookSlack as Record<string, string> | null)?.url
    if (slackUrl) {
        tasks.push(
            fetch(slackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildSlackPayload(data)),
            })
                .then(res => {
                    if (!res.ok) console.warn(`[Webhook] Slack failed: ${res.status}`)
                    else console.log('[Webhook] Slack notification sent')
                })
                .catch(err => console.warn('[Webhook] Slack error:', err.message))
        )
    }

    // Custom
    const customUrl = (webhookConfig.webhookCustom as Record<string, string> | null)?.url
    if (customUrl) {
        tasks.push(
            fetch(customUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildCustomPayload(data)),
            })
                .then(res => {
                    if (!res.ok) console.warn(`[Webhook] Custom failed: ${res.status}`)
                    else console.log('[Webhook] Custom notification sent')
                })
                .catch(err => console.warn('[Webhook] Custom error:', err.message))
        )
    }

    // Fire all webhooks concurrently — don't block the response
    if (tasks.length > 0) {
        console.log(`[Webhook] Sending ${tasks.length} notification(s)...`)
        await Promise.allSettled(tasks)
    }
}
