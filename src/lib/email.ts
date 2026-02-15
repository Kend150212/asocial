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
        const roleLabel = role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : 'Customer'

        await transporter.sendMail({
            from: `"ASocial" <${from}>`,
            to: toEmail,
            subject: '🎉 Bạn đã được mời tham gia ASocial!',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 0; background: #0f172a;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="font-size: 28px; color: white; margin: 0; letter-spacing: -0.5px;">ASocial</h1>
                        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0;">Social Media Management</p>
                    </div>

                    <!-- Body -->
                    <div style="background: #1e293b; padding: 32px; border: 1px solid #334155; border-top: none;">
                        <h2 style="font-size: 20px; color: #f1f5f9; margin: 0 0 8px;">Xin chào ${toName}! 👋</h2>
                        <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
                            Bạn đã được mời làm <strong style="color: #c084fc;">${roleLabel}</strong> trên nền tảng ASocial.
                            Vui lòng nhấn nút bên dưới để tạo mật khẩu và kích hoạt tài khoản.
                        </p>

                        <!-- Info Card -->
                        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; width: 90px;">Email:</td>
                                    <td style="padding: 8px 0; color: #f1f5f9; font-family: monospace; font-weight: 600;">${toEmail}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #1e293b;">Vai trò:</td>
                                    <td style="padding: 8px 0; color: #c084fc; font-weight: 600; border-top: 1px solid #1e293b;">${roleLabel}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin-bottom: 24px;">
                            <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                                🔐 Tạo mật khẩu →
                            </a>
                        </div>

                        <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center; line-height: 1.5;">
                            Hoặc copy link: <a href="${setupUrl}" style="color: #7c3aed; word-break: break-all;">${setupUrl}</a>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #0f172a; padding: 16px 32px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #334155; border-top: none;">
                        <p style="font-size: 11px; color: #475569; margin: 0;">
                            ⏰ Link này có hiệu lực trong 7 ngày. Nếu hết hạn, vui lòng liên hệ Admin.
                        </p>
                    </div>
                </div>
            `,
        })

        return { success: true }
    } catch (error) {
        console.error('[Email] Failed to send invitation:', error)
        return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' }
    }
}
