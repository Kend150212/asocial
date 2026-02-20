import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

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

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}
