import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
    const { nextUrl, auth: session } = req
    const isLoggedIn = !!session?.user
    const isLoginPage = nextUrl.pathname === '/login'
    const isApiRoute = nextUrl.pathname.startsWith('/api')

    // Allow API routes
    if (isApiRoute) return NextResponse.next()

    // Redirect logged-in users away from login
    if (isLoginPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }

    // Redirect unauthenticated users to login
    if (!isLoginPage && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Admin-only routes
    if (nextUrl.pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
