import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBrandingServer } from '@/lib/use-branding-server'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { authLimiter } from '@/lib/rate-limit'
import { verifyRecaptcha } from '@/lib/recaptcha'

function validatePassword(password: string): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters'
    return null
}

// POST /api/auth/register — Step 1: validate + send OTP
export async function POST(req: NextRequest) {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: allowed } = authLimiter.check(ip)
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    try {
        const { firstName, lastName, email, password, confirmPassword, termsAccepted, locale, recaptchaToken } = await req.json()

        // reCAPTCHA verification
        const isHuman = await verifyRecaptcha(recaptchaToken)
        if (!isHuman) {
            return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 403 })
        }

        const isVi = locale === 'vi'

        // Validate required fields
        if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password || !confirmPassword) {
            return NextResponse.json(
                { error: isVi ? 'Vui lòng điền đầy đủ thông tin' : 'All fields are required' },
                { status: 400 }
            )
        }

        if (!termsAccepted) {
            return NextResponse.json(
                { error: isVi ? 'Bạn phải đồng ý với Điều khoản và Chính sách bảo mật' : 'You must accept the Terms of Service and Privacy Policy' },
                { status: 400 }
            )
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: isVi ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match' },
                { status: 400 }
            )
        }

        const pwError = validatePassword(password)
        if (pwError) {
            return NextResponse.json({ error: pwError }, { status: 400 })
        }

        // Check email not already in use
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
        if (existing) {
            return NextResponse.json(
                { error: isVi ? 'Email này đã được sử dụng' : 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Generate 6-digit OTP
        const code = String(randomInt(100000, 999999))
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Delete any previous unused OTPs for this email
        await prisma.otpToken.deleteMany({ where: { email: email.toLowerCase().trim() } })

        // Store OTP with pending user data
        await prisma.otpToken.create({
            data: {
                email: email.toLowerCase().trim(),
                code,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                password: passwordHash,
                expiresAt,
            },
        })

        // Send OTP email
        const displayName = firstName.trim()
        const brand = await getBrandingServer()
        const subject = isVi ? `Mã xác nhận đăng ký ${brand.appName}` : `${brand.appName} Registration Verification Code`
        const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f0f; color: #f5f5f5; border-radius: 12px;">
  <h2 style="margin: 0 0 12px; font-size: 20px;">${isVi ? 'Xin chào' : 'Hello'}, ${displayName}!</h2>
  <p style="color: #aaa; margin: 0 0 24px;">${isVi ? 'Nhập mã 6 số bên dưới để xác nhận email và hoàn tất đăng ký.' : 'Enter the 6-digit code below to verify your email and complete registration.'}</p>
  <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #fff;">${code}</span>
  </div>
  <p style="color: #666; font-size: 13px; margin: 0;">${isVi ? 'Mã này hết hạn sau 5 phút.' : 'This code expires in 5 minutes.'}</p>
  <p style="color: #666; font-size: 13px; margin-top: 8px;">${isVi ? 'Nếu bạn không đăng ký, hãy bỏ qua email này.' : "If you didn't request this, you can safely ignore this email."}</p>
</div>`

        await sendEmail({
            to: email.toLowerCase().trim(),
            subject,
            html,
        })

        return NextResponse.json({ success: true, email: email.toLowerCase().trim() })
    } catch (error) {
        console.error('[register] error:', error)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}
