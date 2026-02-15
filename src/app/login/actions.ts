'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string) {
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/dashboard',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Invalid email or password' }
                default:
                    return { error: 'Something went wrong. Please try again.' }
            }
        }
        // Re-throw for Next.js redirects (NEXT_REDIRECT)
        throw error
    }
}
