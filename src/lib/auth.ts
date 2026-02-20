// Force trust host for production behind reverse proxy (Nginx)
// Use bracket notation to prevent Turbopack from inlining process.env at build time
const _env = process.env
const _trustKey = 'AUTH_TRUST_HOST'
_env[_trustKey] = 'true'

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

type UserRoleType = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

declare module 'next-auth' {
    interface User {
        role: UserRoleType
        isActive: boolean
    }
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: UserRoleType
            isActive: boolean
            image?: string
        }
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        role: UserRoleType
        isActive: boolean
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.isActive) return null

                // User hasn't set password yet (invited but hasn't completed setup)
                if (!user.passwordHash) return null

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!isValid) return null

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() },
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: user.isActive,
                    image: user.image,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role as UserRoleType
                token.isActive = user.isActive as boolean
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub!
                session.user.role = token.role as UserRoleType
                session.user.isActive = token.isActive as boolean
            }
            return session
        },
    },
})
