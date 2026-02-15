import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import nodemailer from 'nodemailer'

// POST /api/admin/integrations/test — test connection for a provider
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, testEmail } = await req.json()

    const integration = await prisma.apiIntegration.findUnique({ where: { id } })
    if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // For providers other than smtp/gdrive, require API key
    if (!integration.apiKeyEncrypted && !['smtp', 'gdrive'].includes(integration.provider)) {
        return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    }

    const apiKey = integration.apiKeyEncrypted ? decrypt(integration.apiKeyEncrypted) : ''

    try {
        let result: { success: boolean; message: string; data?: unknown }

        switch (integration.provider) {
            case 'vbout':
                result = await testVbout(apiKey, integration.baseUrl)
                break
            case 'openai':
                result = await testOpenAI(apiKey)
                break
            case 'gemini':
                result = await testGemini(apiKey)
                break
            case 'runware':
                result = await testRunware(apiKey)
                break
            case 'smtp':
                result = await testSmtp(
                    integration.config as Record<string, string> | null,
                    apiKey,
                    testEmail
                )
                break
            case 'gdrive':
                result = await testGoogleDrive(apiKey, integration.config as Record<string, string> | null)
                break
            default:
                result = { success: true, message: `Provider ${integration.provider} — API key configured` }
        }

        // Update last tested timestamp
        await prisma.apiIntegration.update({
            where: { id },
            data: {
                lastTestedAt: new Date(),
                status: result.success ? 'ACTIVE' : 'ERROR',
            },
        })

        return NextResponse.json(result)
    } catch (error) {
        await prisma.apiIntegration.update({
            where: { id },
            data: { lastTestedAt: new Date(), status: 'ERROR' },
        })
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Connection test failed',
        })
    }
}

async function testVbout(apiKey: string, baseUrl?: string | null) {
    const url = `${baseUrl || 'https://api.vbout.com/1'}/app/me.json?key=${apiKey}`
    const res = await fetch(url, { method: 'GET' })
    const data = await res.json()

    if (data?.response?.header?.status === 'ok' || data?.response?.data) {
        return {
            success: true,
            message: 'VBOUT connection successful',
            data: { account: data?.response?.data?.account?.name || 'Connected' },
        }
    }
    return { success: false, message: data?.response?.header?.message || 'VBOUT connection failed' }
}

async function testOpenAI(apiKey: string) {
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (res.ok) {
        const data = await res.json()
        return {
            success: true,
            message: `OpenAI connected — ${data.data?.length || 0} models available`,
        }
    }

    const error = await res.json().catch(() => ({}))
    return {
        success: false,
        message: error?.error?.message || `OpenAI error: ${res.status}`,
    }
}

async function testGemini(apiKey: string) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (res.ok) {
        const data = await res.json()
        return {
            success: true,
            message: `Gemini connected — ${data.models?.length || 0} models available`,
        }
    }

    const error = await res.json().catch(() => ({}))
    return {
        success: false,
        message: error?.error?.message || `Gemini error: ${res.status}`,
    }
}

async function testRunware(apiKey: string) {
    const res = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify([
            { taskType: 'authentication', apiKey },
        ]),
    })

    if (res.ok) {
        return { success: true, message: 'Runware connection successful' }
    }

    return {
        success: false,
        message: `Runware error: ${res.status}`,
    }
}

async function testSmtp(
    config: Record<string, string> | null,
    password: string,
    testEmail?: string
) {
    const host = config?.smtpHost || 'smtp.gmail.com'
    const port = parseInt(config?.smtpPort || '465', 10)
    const secure = config?.smtpSecure || 'ssl'
    const username = config?.smtpUsername
    const from = config?.smtpFrom || username

    if (!username) {
        return { success: false, message: 'SMTP username not configured' }
    }

    if (!password) {
        return { success: false, message: 'SMTP password not configured — please save first' }
    }

    if (!testEmail) {
        return { success: false, message: 'Please enter a test email address' }
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: secure === 'ssl',
            auth: {
                user: username,
                pass: password,
            },
            ...(secure === 'tls' ? { requireTLS: true } : {}),
        })

        // Verify connection first
        await transporter.verify()

        // Send a test email
        const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        await transporter.sendMail({
            from: `"ASocial" <${from}>`,
            to: testEmail,
            subject: '✅ ASocial — SMTP Test Successful',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="font-size: 24px; color: #10b981; margin: 0;">✅ SMTP Test OK</h1>
                    </div>
                    <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
                        <p style="font-size: 14px; color: #334155; margin: 0 0 12px;">Your SMTP configuration is working correctly!</p>
                        <table style="width: 100%; font-size: 13px; color: #64748b;">
                            <tr><td style="padding: 4px 0;"><strong>Host:</strong></td><td>${host}:${port}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Security:</strong></td><td>${secure.toUpperCase()}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>From:</strong></td><td>${from}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Time:</strong></td><td>${now}</td></tr>
                        </table>
                    </div>
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 16px; text-align: center;">
                        Sent by ASocial Email System
                    </p>
                </div>
            `,
        })

        return {
            success: true,
            message: `Test email sent to ${testEmail}`,
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'SMTP connection failed'
        return {
            success: false,
            message: `SMTP error: ${msg}`,
        }
    }
}

async function testGoogleDrive(clientSecret: string, config: Record<string, string> | null) {
    const clientId = config?.gdriveClientId

    if (!clientId) {
        return { success: false, message: 'Client ID not configured' }
    }

    if (!clientSecret) {
        return { success: false, message: 'Client Secret not configured' }
    }

    // Validate OAuth2 credentials by calling Google's token endpoint
    // We request a token using client_credentials to verify the Client ID/Secret are valid
    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
            }),
        })

        const data = await res.json()

        // Google doesn't support client_credentials grant, but if 
        // credentials are invalid we get 'unauthorized_client' or 'invalid_client'
        // If credentials are valid we get 'unsupported_grant_type' which means creds are OK
        if (data.error === 'unsupported_grant_type') {
            return {
                success: true,
                message: `Google Drive OAuth2 credentials valid — Client ID: ${clientId.slice(0, 12)}...`,
            }
        }

        if (data.error === 'invalid_client') {
            return {
                success: false,
                message: 'Invalid Client ID or Client Secret — please check your credentials',
            }
        }

        // Any other response — credentials might be valid
        return {
            success: true,
            message: `Google Drive configured — Client ID: ${clientId.slice(0, 12)}...`,
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to verify Google Drive credentials',
        }
    }
}
