import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Allow all requests to pass through
    // Auth is handled by the dashboard layout (server component)
    // This avoids edge runtime cookie issues with server actions

    // Only handle: redirect logged-in users away from login page
    const isLoginPage = pathname === '/login'
    if (isLoginPage) {
        // Check for session cookie existence (simple check, no JWT verification)
        const hasSession = req.cookies.has('__Secure-authjs.session-token') ||
            req.cookies.has('authjs.session-token') ||
            req.cookies.has('next-auth.session-token')

        if (hasSession) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}
