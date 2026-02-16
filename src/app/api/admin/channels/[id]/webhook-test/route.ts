import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// POST /api/admin/channels/[id]/webhook-test — test a webhook
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await params // consume params
    const body = await req.json()
    const { platform, url, botToken, chatId } = body

    if (!platform) {
        return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

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
                        content: '✅ **ASocial Webhook Test** — Connection successful! This channel will receive notifications.',
                        username: 'ASocial',
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
                        text: '✅ *ASocial Webhook Test* — Connection successful! This channel will receive notifications.',
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
                        text: '✅ *ASocial Webhook Test* — Connection successful! This channel will receive notifications.',
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
                        source: 'asocial',
                        message: 'Webhook test — Connection successful!',
                        timestamp: new Date().toISOString(),
                    }),
                })
                success = res.ok
                message = success ? 'Custom webhook test successful!' : `Error: ${res.statusText}`
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
