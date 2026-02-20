import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    const hasSession =
        req.cookies.has('__Secure-authjs.session-token') ||
        req.cookies.has('authjs.session-token') ||
        req.cookies.has('next-auth.session-token')

    // Try to read role from JWT cookie
    let userRole: string | null = null
    const jwtCookie =
        req.cookies.get('__Secure-authjs.session-token') ||
        req.cookies.get('authjs.session-token') ||
        req.cookies.get('next-auth.session-token')
    if (jwtCookie?.value) {
        try {
            const parts = jwtCookie.value.split('.')
            if (parts.length >= 2) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
                userRole = payload.role || null
            }
        } catch { /* ignore */ }
    }

    // Read access-mode cookie (set by /choose page for dual-access users)
    const accessMode = req.cookies.get('access-mode')?.value

    // ── Redirect logged-in users away from public pages ───────────────
    const isPublicPage = pathname === '/' || pathname === '/login'
    if (isPublicPage && hasSession) {
        return NextResponse.redirect(new URL('/choose', req.url))
    }

    // ── Protect dashboard routes — redirect to login with callbackUrl ─
    const isDashboardRoute = pathname.startsWith('/dashboard')
    if (isDashboardRoute && !hasSession) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
        return NextResponse.redirect(loginUrl)
    }

    // ── CUSTOMER trying to access dashboard ───────────────────────────
    // If they chose "dashboard" on /choose page (cookie set), allow through
    // Otherwise redirect to /choose for dual-access check
    if (isDashboardRoute && hasSession && userRole === 'CUSTOMER' && accessMode !== 'dashboard') {
        return NextResponse.redirect(new URL('/choose', req.url))
    }

    // ── Protect portal routes — redirect to login ─────────────────────
    if (pathname.startsWith('/portal') && !hasSession) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', '/portal')
        return NextResponse.redirect(loginUrl)
    }

    // ── Protect choose route ──────────────────────────────────────────
    if (pathname === '/choose' && !hasSession) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}
