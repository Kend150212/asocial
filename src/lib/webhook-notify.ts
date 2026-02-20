// Webhook notification helper — sends post-publish notifications to
// Discord, Telegram, Slack, and custom webhook endpoints configured on a channel.

import { getBrandingServer } from '@/lib/use-branding-server'

// Cached app name for webhook payloads
let _cachedAppName: string | null = null
async function getAppName(): Promise<string> {
    if (_cachedAppName) return _cachedAppName
    const brand = await getBrandingServer()
    _cachedAppName = brand.appName
    return _cachedAppName
}

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

function buildDiscordPayload(data: PublishNotificationData, appName: string) {
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
        username: appName,
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

function buildCustomPayload(data: PublishNotificationData, appName: string) {
    return {
        event: 'post.published',
        source: appName.toLowerCase(),
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
    const appName = await getAppName()

    // Discord
    const discordUrl = (webhookConfig.webhookDiscord as Record<string, string> | null)?.url
    if (discordUrl) {
        tasks.push(
            fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildDiscordPayload(data, appName)),
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
                body: JSON.stringify(buildCustomPayload(data, appName)),
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

// ─── Approval notification helpers ───────────────────────────────────

export interface ApprovalNotificationData {
    postId: string
    content: string
    action: 'approved' | 'rejected'
    reviewedBy: string
    reviewedAt: Date
    channelName: string
    authorName: string
    comment?: string
    scheduledAt?: Date | null
}

function buildApprovalDiscordPayload(data: ApprovalNotificationData, appName: string) {
    const isApproved = data.action === 'approved'
    const color = isApproved ? 0x22c55e : 0xef4444
    const title = isApproved ? '✅ Post Approved' : '❌ Post Rejected'
    const truncated = data.content.length > 200 ? data.content.slice(0, 200) + '…' : data.content
    const fields: { name: string; value: string; inline: boolean }[] = [
        { name: '📡 Channel', value: data.channelName, inline: true },
        { name: '👤 Author', value: data.authorName, inline: true },
        { name: '🔍 Reviewed by', value: data.reviewedBy, inline: true },
        { name: '🕐 Time', value: `<t:${Math.floor(data.reviewedAt.getTime() / 1000)}:R>`, inline: true },
    ]
    if (data.scheduledAt && isApproved) {
        fields.push({ name: '📅 Scheduled for', value: `<t:${Math.floor(data.scheduledAt.getTime() / 1000)}:f>`, inline: true })
    }
    if (data.comment) fields.push({ name: '💬 Comment', value: data.comment, inline: false })
    return {
        username: appName,
        embeds: [{ title, color, description: truncated, fields, footer: { text: `Post ID: ${data.postId}` }, timestamp: data.reviewedAt.toISOString() }],
    }
}

function buildApprovalTelegramMessage(data: ApprovalNotificationData): string {
    const isApproved = data.action === 'approved'
    const truncated = data.content.length > 200 ? data.content.slice(0, 200) + '…' : data.content
    let msg = isApproved ? `✅ *Post Approved*\n\n` : `❌ *Post Rejected*\n\n`
    msg += `📝 ${truncated}\n\n`
    msg += `📡 *Channel:* ${data.channelName}\n`
    msg += `👤 *Author:* ${data.authorName}\n`
    msg += `🔍 *Reviewed by:* ${data.reviewedBy}\n`
    if (data.scheduledAt && isApproved) {
        msg += `📅 *Scheduled:* ${data.scheduledAt.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`
    }
    if (data.comment) msg += `💬 *Comment:* ${data.comment}\n`
    return msg
}

function buildApprovalSlackPayload(data: ApprovalNotificationData) {
    const isApproved = data.action === 'approved'
    const truncated = data.content.length > 200 ? data.content.slice(0, 200) + '…' : data.content
    const headerText = isApproved ? '✅ Post Approved' : '❌ Post Rejected'
    const fields = [
        { type: 'mrkdwn', text: `*📡 Channel:*\n${data.channelName}` },
        { type: 'mrkdwn', text: `*👤 Author:*\n${data.authorName}` },
        { type: 'mrkdwn', text: `*🔍 Reviewed by:*\n${data.reviewedBy}` },
    ]
    const blocks: unknown[] = [
        { type: 'header', text: { type: 'plain_text', text: headerText, emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: truncated } },
        { type: 'section', fields },
    ]
    if (data.comment) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*💬 Comment:*\n${data.comment}` } })
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `Post ID: ${data.postId}` }] })
    return { blocks }
}

function buildApprovalCustomPayload(data: ApprovalNotificationData, appName: string) {
    return {
        event: `post.${data.action}`,
        source: appName.toLowerCase(),
        timestamp: data.reviewedAt.toISOString(),
        post: { id: data.postId, content: data.content },
        channel: data.channelName,
        author: data.authorName,
        reviewedBy: data.reviewedBy,
        comment: data.comment || null,
        scheduledAt: data.scheduledAt?.toISOString() || null,
    }
}

export async function sendApprovalWebhooks(
    webhookConfig: WebhookConfig,
    data: ApprovalNotificationData,
): Promise<void> {
    const tasks: Promise<void>[] = []
    const appName = await getAppName()

    const discordUrl = (webhookConfig.webhookDiscord as Record<string, string> | null)?.url
    if (discordUrl) {
        tasks.push(
            fetch(discordUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApprovalDiscordPayload(data, appName)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Approval Discord failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Approval Discord error:', err.message))
        )
    }

    const tgConfig = webhookConfig.webhookTelegram as Record<string, string> | null
    if (tgConfig?.botToken && tgConfig?.chatId) {
        tasks.push(
            fetch(`https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: tgConfig.chatId, text: buildApprovalTelegramMessage(data), parse_mode: 'Markdown' }),
            })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Approval Telegram failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Approval Telegram error:', err.message))
        )
    }

    const slackUrl = (webhookConfig.webhookSlack as Record<string, string> | null)?.url
    if (slackUrl) {
        tasks.push(
            fetch(slackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApprovalSlackPayload(data)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Approval Slack failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Approval Slack error:', err.message))
        )
    }

    const customUrl = (webhookConfig.webhookCustom as Record<string, string> | null)?.url
    if (customUrl) {
        tasks.push(
            fetch(customUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildApprovalCustomPayload(data, appName)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Approval Custom failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Approval Custom error:', err.message))
        )
    }

    if (tasks.length > 0) {
        console.log(`[Webhook] Sending ${tasks.length} approval notification(s) for action=${data.action}...`)
        await Promise.allSettled(tasks)
    }
}

// ─── Pending Approval notification ───────────────────────────────────
// Fires when a post is submitted for review (PENDING_APPROVAL status).
// Includes full post content, first image thumbnail, and a link to the Approvals page.

export interface PendingApprovalNotificationData {
    postId: string
    content: string
    authorName: string
    channelName: string
    platforms: string[]          // platform names selected for this post
    scheduledAt?: Date | null
    imageUrl?: string | null     // first media image URL (if any)
    appBaseUrl: string           // e.g. https://app.yourdomain.com
}

function approvalsUrl(base: string) {
    return `${base}/dashboard/posts/approvals`
}

function buildPendingDiscordPayload(data: PendingApprovalNotificationData, appName: string) {
    const truncated = data.content.length > 300 ? data.content.slice(0, 300) + '…' : data.content
    const platformsLine = data.platforms.map(p => getPlatformLabel(p)).join(', ') || '—'
    const url = approvalsUrl(data.appBaseUrl)
    const fields: { name: string; value: string; inline: boolean }[] = [
        { name: '📡 Channel', value: data.channelName, inline: true },
        { name: '👤 Author', value: data.authorName, inline: true },
        { name: '📱 Platforms', value: platformsLine, inline: false },
    ]
    if (data.scheduledAt) {
        fields.push({ name: '📅 Scheduled for', value: `<t:${Math.floor(data.scheduledAt.getTime() / 1000)}:f>`, inline: true })
    }
    // Discord webhook can't do buttons, but a clickable title link is the best option
    return {
        username: appName,
        embeds: [{
            title: '🔔 Post Pending Approval — Click to Review',
            url,               // ← makes the embed title a hyperlink to the Approvals page
            color: 0xf59e0b,   // amber
            description: truncated,
            fields,
            ...(data.imageUrl ? { image: { url: data.imageUrl } } : {}),
            footer: { text: `Post ID: ${data.postId} • Click the title to open Approvals` },
            timestamp: new Date().toISOString(),
        }],
    }
}

async function sendPendingTelegram(tgConfig: Record<string, string>, data: PendingApprovalNotificationData): Promise<void> {
    const truncated = data.content.length > 300 ? data.content.slice(0, 300) + '…' : data.content
    const platformsLine = data.platforms.map(p => getPlatformLabel(p)).join(', ') || '—'
    let caption = `🔔 *Post Pending Approval*\n\n`
    caption += `📝 ${truncated}\n\n`
    caption += `📡 *Channel:* ${data.channelName}\n`
    caption += `👤 *Author:* ${data.authorName}\n`
    caption += `📱 *Platforms:* ${platformsLine}\n`
    if (data.scheduledAt) {
        caption += `📅 *Scheduled:* ${data.scheduledAt.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`
    }

    const inlineKeyboard = {
        inline_keyboard: [[
            { text: '🔍 Review & Approve', url: approvalsUrl(data.appBaseUrl) },
        ]],
    }

    const base = `https://api.telegram.org/bot${tgConfig.botToken}`

    // If there's an image, send as photo with caption; otherwise plain message
    if (data.imageUrl) {
        await fetch(`${base}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: tgConfig.chatId,
                photo: data.imageUrl,
                caption: caption.slice(0, 1024), // Telegram photo caption limit
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
            }),
        }).then(res => { if (!res.ok) console.warn(`[Webhook] Pending Telegram sendPhoto failed: ${res.status}`) })
    } else {
        await fetch(`${base}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: tgConfig.chatId,
                text: caption,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
            }),
        }).then(res => { if (!res.ok) console.warn(`[Webhook] Pending Telegram sendMessage failed: ${res.status}`) })
    }
}

function buildPendingSlackPayload(data: PendingApprovalNotificationData) {
    const truncated = data.content.length > 300 ? data.content.slice(0, 300) + '…' : data.content
    const platformsLine = data.platforms.map(p => getPlatformLabel(p)).join(', ') || '—'
    const url = approvalsUrl(data.appBaseUrl)

    const blocks: unknown[] = [
        { type: 'header', text: { type: 'plain_text', text: '🔔 Post Pending Approval', emoji: true } },
        { type: 'section', text: { type: 'mrkdwn', text: truncated } },
        {
            type: 'section',
            fields: [
                { type: 'mrkdwn', text: `*📡 Channel:*\n${data.channelName}` },
                { type: 'mrkdwn', text: `*👤 Author:*\n${data.authorName}` },
                { type: 'mrkdwn', text: `*📱 Platforms:*\n${platformsLine}` },
                ...(data.scheduledAt ? [{ type: 'mrkdwn', text: `*📅 Scheduled:*\n<!date^${Math.floor(data.scheduledAt.getTime() / 1000)}^{date_short_pretty} {time}|${data.scheduledAt.toISOString()}>` }] : []),
            ],
        },
        // Image block if available
        ...(data.imageUrl ? [{ type: 'image', image_url: data.imageUrl, alt_text: 'Post image' }] : []),
        // ← Action button with URL
        {
            type: 'actions',
            elements: [{
                type: 'button',
                text: { type: 'plain_text', text: '🔍 Review & Approve', emoji: true },
                url,
                style: 'primary',
            }],
        },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `Post ID: ${data.postId}` }] },
    ]
    return { blocks }
}

function buildPendingCustomPayload(data: PendingApprovalNotificationData, appName: string) {
    return {
        event: 'post.pending_approval',
        source: appName.toLowerCase(),
        timestamp: new Date().toISOString(),
        post: { id: data.postId, content: data.content, imageUrl: data.imageUrl || null },
        channel: data.channelName,
        author: data.authorName,
        platforms: data.platforms,
        scheduledAt: data.scheduledAt?.toISOString() || null,
        approvalsUrl: approvalsUrl(data.appBaseUrl),
    }
}

export async function sendPendingApprovalWebhooks(
    webhookConfig: WebhookConfig,
    data: PendingApprovalNotificationData,
): Promise<void> {
    const tasks: Promise<void>[] = []
    const appName = await getAppName()

    const discordUrl = (webhookConfig.webhookDiscord as Record<string, string> | null)?.url
    if (discordUrl) {
        tasks.push(
            fetch(discordUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPendingDiscordPayload(data, appName)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Pending Discord failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Pending Discord error:', err.message))
        )
    }

    const tgConfig = webhookConfig.webhookTelegram as Record<string, string> | null
    if (tgConfig?.botToken && tgConfig?.chatId) {
        tasks.push(
            sendPendingTelegram(tgConfig, data).catch(err => console.warn('[Webhook] Pending Telegram error:', err.message))
        )
    }

    const slackUrl = (webhookConfig.webhookSlack as Record<string, string> | null)?.url
    if (slackUrl) {
        tasks.push(
            fetch(slackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPendingSlackPayload(data)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Pending Slack failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Pending Slack error:', err.message))
        )
    }

    const customUrl = (webhookConfig.webhookCustom as Record<string, string> | null)?.url
    if (customUrl) {
        tasks.push(
            fetch(customUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPendingCustomPayload(data, appName)) })
                .then(res => { if (!res.ok) console.warn(`[Webhook] Pending Custom failed: ${res.status}`) })
                .catch(err => console.warn('[Webhook] Pending Custom error:', err.message))
        )
    }

    if (tasks.length > 0) {
        console.log(`[Webhook] Sending ${tasks.length} pending-approval notification(s)...`)
        await Promise.allSettled(tasks)
    }
}

