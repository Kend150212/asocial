import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBrandingServer } from '@/lib/use-branding-server'

// POST /api/admin/channels/[id]/webhook-test — test a webhook
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params // consume params
    const body = await req.json()
    const { platform, url, botToken, chatId } = body

    if (!platform) {
        return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    const brand = await getBrandingServer()

    try {
        let success = false
        let message = ''

        switch (platform) {
            case 'discord': {
                if (!url) return NextResponse.json({ error: 'Discord webhook URL is required' }, { status: 400 })
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `✅ **${brand.appName} Webhook Test** — Connection successful! This channel will receive notifications.`,
                        username: brand.appName,
                    }),
                })
                success = res.ok
                message = success ? 'Discord webhook test successful!' : `Discord error: ${res.statusText}`
                break
            }

            case 'telegram': {
                if (!botToken || !chatId) {
                    return NextResponse.json({ error: 'Bot Token and Chat ID are required' }, { status: 400 })
                }
                const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `✅ *${brand.appName} Webhook Test* — Connection successful! This channel will receive notifications.`,
                        parse_mode: 'Markdown',
                    }),
                })
                const data = await res.json()
                success = data.ok === true
                message = success ? 'Telegram bot test successful!' : `Telegram error: ${data.description || res.statusText}`
                break
            }

            case 'slack': {
                if (!url) return NextResponse.json({ error: 'Slack webhook URL is required' }, { status: 400 })
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `✅ *${brand.appName} Webhook Test* — Connection successful! This channel will receive notifications.`,
                    }),
                })
                success = res.ok
                message = success ? 'Slack webhook test successful!' : `Slack error: ${res.statusText}`
                break
            }

            case 'custom': {
                if (!url) return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'test',
                        source: brand.appName.toLowerCase(),
                        message: 'Webhook test — Connection successful!',
                        timestamp: new Date().toISOString(),
                    }),
                })
                success = res.ok
                message = success ? 'Custom webhook test successful!' : `Error: ${res.statusText}`
                break
            }

            case 'zalo': {
                const { refreshToken: rt, appId: ai, secretKey: sk, userId: uid } = body
                if (!rt || !ai || !sk || !uid) {
                    return NextResponse.json({ error: 'App ID, Secret Key, Refresh Token, and User ID are required' }, { status: 400 })
                }
                // Step 1: Get access token via refresh
                const tokenRes = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', secret_key: sk },
                    body: new URLSearchParams({ refresh_token: rt, app_id: ai, grant_type: 'refresh_token' }),
                })
                const tokenData = await tokenRes.json()
                if (!tokenData.access_token) {
                    return NextResponse.json({ success: false, message: `Zalo token refresh failed: ${tokenData.error_description || tokenData.error_name || JSON.stringify(tokenData)}` })
                }
                // Step 2: Send test message
                const msgRes = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', access_token: tokenData.access_token },
                    body: JSON.stringify({
                        recipient: { user_id: uid },
                        message: { text: `✅ ${brand.appName} Webhook Test — Kết nối Zalo OA thành công! Channel này sẽ nhận notifications.` },
                    }),
                })
                const msgData = await msgRes.json()
                success = msgData.error === 0 || msgRes.ok
                message = success ? 'Zalo OA test successful!' : `Zalo error: ${msgData.message || JSON.stringify(msgData)}`
                break
            }

            default:
                return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 })
        }

        return NextResponse.json({ success, message })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed',
        })
    }
}
