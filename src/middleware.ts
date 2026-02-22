import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge-compatible setup check.
 * Middleware runs in Edge Runtime — no fs/path/process.cwd().
 * Instead, check if DATABASE_URL env var exists (set by wizard or .env).
 * If no DATABASE_URL → app needs setup → redirect to /setup.
 */
function isSetupComplete(): boolean {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return false
    // Skip if it's the placeholder from install.sh
    if (dbUrl.includes('temporary') || dbUrl === '') return false
    return true
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // ── Setup wizard redirect — if not configured yet ─────────────
    const isSetupRoute = pathname.startsWith('/setup') || pathname.startsWith('/api/setup')
    const setupComplete = isSetupComplete()

    if (!isSetupRoute && !setupComplete) {
        return NextResponse.redirect(new URL('/setup', req.url))
    }
    // If setup is complete, prevent accessing /setup again
    if (pathname.startsWith('/setup') && setupComplete) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    const hasSession =
        req.cookies.has('__Secure-authjs.session-token') ||
        req.cookies.has('authjs.session-token') ||
        req.cookies.has('next-auth.session-token')

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

    // ── Protect /admin routes — redirect to login ─────────────────────
    if (pathname.startsWith('/admin') && !hasSession) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}

