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
        const logoUrl = `${appUrl}/logo.png`
        const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'MANAGER' ? 'Manager' : 'Customer'
        const roleBg = role === 'ADMIN' ? '#dc2626' : role === 'MANAGER' ? '#7c3aed' : '#0891b2'

        await transporter.sendMail({
            from: `"ASocial" <${from}>`,
            to: toEmail,
            subject: `You've been invited to join ASocial`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr><td align="center">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">

                <!-- Logo -->
                <tr><td style="padding: 0 0 32px; text-align: center;">
                    <img src="${logoUrl}" alt="ASocial" width="52" height="52" style="border-radius: 14px; display: inline-block;" />
                </td></tr>

                <!-- Main Card -->
                <tr><td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); overflow: hidden;">

                        <!-- Gradient Accent Bar -->
                        <tr><td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #ec4899);"></td></tr>

                        <!-- Header -->
                        <tr><td style="padding: 36px 36px 0;">
                            <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.3px;">You're invited!</h1>
                            <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                                You've been added to <strong style="color: #18181b;">ASocial</strong> as a team member. Set up your password below to get started.
                            </p>
                        </td></tr>

                        <!-- Info Card -->
                        <tr><td style="padding: 24px 36px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid #f4f4f5;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0 0 2px; font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Name</p>
                                                    <p style="margin: 0; font-size: 15px; color: #18181b; font-weight: 500;">${toName}</p>
                                                </td>
                                                <td align="right" valign="top">
                                                    <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: ${roleBg}; letter-spacing: 0.3px;">${roleLabel}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="margin: 0 0 2px; font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Email</p>
                                        <p style="margin: 0; font-size: 15px; color: #18181b; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${toEmail}</p>
                                    </td>
                                </tr>
                            </table>
                        </td></tr>

                        <!-- CTA Button -->
                        <tr><td style="padding: 0 36px 36px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr><td align="center">
                                    <a href="${setupUrl}" style="display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; box-sizing: border-box;">
                                        Set Up Your Password →
                                    </a>
                                </td></tr>
                            </table>
                            <p style="margin: 12px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                This link expires in 7 days
                            </p>
                        </td></tr>

                    </table>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding: 28px 36px; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #a1a1aa;">
                        If the button doesn't work, copy this link:
                    </p>
                    <p style="margin: 0 0 20px; font-size: 11px; word-break: break-all;">
                        <a href="${setupUrl}" style="color: #6366f1; text-decoration: none;">${setupUrl}</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #d4d4d8;">
                        &copy; ${new Date().getFullYear()} ASocial &middot; Social Media Management Platform
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

// ─── Send Channel Invite Email ──────────────────────
export async function sendChannelInviteEmail({
    toEmail,
    toName,
    channelName,
    inviterName,
    role,
    appUrl,
    inviteToken,
}: {
    toEmail: string
    toName: string
    channelName: string
    inviterName: string
    role: string
    appUrl: string
    inviteToken: string
}) {
    try {
        const smtp = await getTransporter()
        if (!smtp) {
            console.warn('[Email] SMTP not configured, skipping channel invite email')
            return { success: false, reason: 'SMTP not configured' }
        }

        const { transporter, from } = smtp
        const setupUrl = `${appUrl}/setup-password?token=${inviteToken}`
        const logoUrl = `${appUrl}/logo.png`
        const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'MANAGER' ? 'Manager' : 'Customer'
        const roleBg = role === 'ADMIN' ? '#dc2626' : role === 'MANAGER' ? '#7c3aed' : '#0891b2'

        await transporter.sendMail({
            from: `"ASocial" <${from}>`,
            to: toEmail,
            subject: `You've been invited to channel "${channelName}" on ASocial`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 48px 16px;">
        <tr><td align="center">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
                <tr><td style="padding: 0 0 32px; text-align: center;">
                    <img src="${logoUrl}" alt="ASocial" width="52" height="52" style="border-radius: 14px; display: inline-block;" />
                </td></tr>
                <tr><td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); overflow: hidden;">
                        <tr><td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #ec4899);"></td></tr>
                        <tr><td style="padding: 36px 36px 0;">
                            <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; color: #18181b;">You're invited to a channel!</h1>
                            <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">
                                <strong style="color: #18181b;">${inviterName}</strong> has invited you to join the channel <strong style="color: #18181b;">"${channelName}"</strong> on ASocial.
                            </p>
                        </td></tr>
                        <tr><td style="padding: 24px 36px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #f4f4f5;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                                        <td>
                                            <p style="margin: 0 0 2px; font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Channel</p>
                                            <p style="margin: 0; font-size: 15px; color: #18181b; font-weight: 500;">${channelName}</p>
                                        </td>
                                        <td align="right" valign="top">
                                            <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #ffffff; background-color: ${roleBg};">${roleLabel}</span>
                                        </td>
                                    </tr></table>
                                </td></tr>
                                <tr><td style="padding: 16px 20px;">
                                    <p style="margin: 0 0 2px; font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Your Email</p>
                                    <p style="margin: 0; font-size: 15px; color: #18181b; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;">${toEmail}</p>
                                </td></tr>
                            </table>
                        </td></tr>
                        <tr><td style="padding: 0 36px 36px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr><td align="center">
                                    <a href="${setupUrl}" style="display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; box-sizing: border-box;">
                                        Accept Invitation & Set Up Password →
                                    </a>
                                </td></tr>
                            </table>
                            <p style="margin: 12px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">This link expires in 7 days</p>
                        </td></tr>
                    </table>
                </td></tr>
                <tr><td style="padding: 28px 36px; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #a1a1aa;">If the button doesn't work, copy this link:</p>
                    <p style="margin: 0 0 20px; font-size: 11px; word-break: break-all;">
                        <a href="${setupUrl}" style="color: #6366f1; text-decoration: none;">${setupUrl}</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #d4d4d8;">
                        &copy; ${new Date().getFullYear()} ASocial &middot; Social Media Management Platform
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
        console.error('[Email] Failed to send channel invite:', error)
        return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
}
