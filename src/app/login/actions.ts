'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid email or password'
                default:
                    return 'Something went wrong. Please try again.'
            }
        }
        // IMPORTANT: re-throw non-AuthError errors (like NEXT_REDIRECT)
        throw error
    }
}
