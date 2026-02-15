import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const isLoginPage = pathname === '/login'
    const isApiRoute = pathname.startsWith('/api')

    // Allow API routes and static assets
    if (isApiRoute) return NextResponse.next()

    // Get JWT token (doesn't need Prisma/crypto)
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    const isLoggedIn = !!token

    // Redirect logged-in users away from login
    if (isLoginPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect unauthenticated users to login
    if (!isLoginPage && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Admin-only routes
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
