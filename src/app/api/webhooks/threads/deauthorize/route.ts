import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks/threads/deauthorize
// Called by Meta when a user removes/deauthorizes the Threads app
// Required for Threads API compliance
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        console.log('[Threads Webhook] User deauthorized:', JSON.stringify(body))
        // TODO: optionally remove the user's channelPlatform record here
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ success: true })
    }
}
