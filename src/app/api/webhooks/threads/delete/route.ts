import { NextRequest, NextResponse } from 'next/server'

// POST /api/webhooks/threads/delete
// Called by Meta when a user requests deletion of their data (GDPR compliance)
// Required for Threads API compliance
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        console.log('[Threads Webhook] Data deletion requested:', JSON.stringify(body))
        // TODO: handle user data deletion if needed
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ success: true })
    }
}
