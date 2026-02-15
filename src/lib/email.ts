import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// ─── Get SMTP transporter from ApiIntegration ───────
async function getTransporter() {
    const smtp = await prisma.apiIntegration.findFirst({
        where: { provider: 'smtp', status: 'ACTIVE' },
    })

    if (!smtp) {
        console.warn('[Email] No active SMTP integration found in database')
        return null
    }

    const config = (smtp.config as Record<string, string>) || {}
    const host = config.smtpHost || 'smtp.gmail.com'
    const port = parseInt(config.smtpPort || '465', 10)
    const secure = config.smtpSecure || 'ssl'
    const username = config.smtpUsername
    const password = smtp.apiKeyEncrypted ? decrypt(smtp.apiKeyEncrypted) : null
    const from = config.smtpFrom || username

    if (!username || !password) {
        console.warn('[Email] SMTP username or password missing', { hasUsername: !!username, hasPassword: !!password })
        return null
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure === 'ssl',
        auth: { user: username, pass: password },
        ...(secure === 'tls' ? { requireTLS: true } : {}),
    })

    return { transporter, from }
}

// ─── Send Invitation Email ──────────────────────────
export async function sendInvitationEmail({
    toEmail,
    toName,
    role,
    appUrl,
    inviteToken,
}: {
    toEmail: string
    toName: string
    role: string
    appUrl: string
    inviteToken: string
}) {
    try {
        const smtp = await getTransporter()
        if (!smtp) {
            console.warn('[Email] SMTP not configured, skipping invitation email')
            return { success: false, reason: 'SMTP not configured' }
        }

        const { transporter, from } = smtp
        const setupUrl = `${appUrl}/setup-password?token=${inviteToken}`
        const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'MANAGER' ? 'Manager' : 'Customer'

        await transporter.sendMail({
            from: `"ASocial" <${from}>`,
            to: toEmail,
            subject: `You've been invited to ASocial`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; padding: 40px 16px;">
        <tr><td align="center">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">

                <!-- Logo & Header -->
                <tr><td style="padding: 32px 40px 24px; text-align: center;">
                    <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); border-radius: 12px; line-height: 48px; font-size: 20px; font-weight: 700; color: white; letter-spacing: -1px;">A</div>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #525252; letter-spacing: 2px; text-transform: uppercase;">ASocial</p>
                </td></tr>

                <!-- Main Card -->
                <tr><td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden;">

                        <!-- Accent Bar -->
                        <tr><td style="height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #ec4899);"></td></tr>

                        <!-- Content -->
                        <tr><td style="padding: 40px 36px 32px;">

                            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #f5f5f5; letter-spacing: -0.3px;">You're invited</h1>
                            <p style="margin: 0 0 28px; font-size: 14px; color: #737373; line-height: 1.6;">
                                You've been added as <strong style="color: #a78bfa;">${roleLabel}</strong> on ASocial. Set up your password to activate your account.
                            </p>

                            <!-- Credentials Card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #141414; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
                                        <p style="margin: 0 0 2px; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                                        <p style="margin: 0; font-size: 14px; color: #e5e5e5; font-family: 'SF Mono', 'Fira Code', monospace;">${toEmail}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
                                        <p style="margin: 0 0 2px; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">Name</p>
                                        <p style="margin: 0; font-size: 14px; color: #e5e5e5;">${toName}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="margin: 0 0 2px; font-size: 11px; color: #525252; text-transform: uppercase; letter-spacing: 1px;">Role</p>
                                        <p style="margin: 0; font-size: 14px; color: #a78bfa; font-weight: 600;">${roleLabel}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr><td align="center">
                                    <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.2px;">
                                        Set Up Password
                                    </a>
                                </td></tr>
                            </table>

                        </td></tr>
                    </table>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding: 28px 40px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #404040;">
                        This invitation expires in 7 days.
                    </p>
                    <p style="margin: 0 0 16px; font-size: 11px; color: #333333; word-break: break-all;">
                        <a href="${setupUrl}" style="color: #6366f1; text-decoration: none;">${setupUrl}</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #333333;">
                        &copy; ${new Date().getFullYear()} ASocial &middot; Social Media Management
                    </p>
                </td></tr>

            </table>
        </td></tr>
    </table>
</body>
</html>
            `,
        })

        return { success: true }
    } catch (error) {
        console.error('[Email] Failed to send invitation:', error)
        return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
}
