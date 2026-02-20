/**
 * Next.js Instrumentation — runs once at server startup.
 * Loads Google OAuth credentials from Admin API Hub into process.env
 * so that auth.ts can conditionally enable the Google provider.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const { prisma } = await import('./src/lib/prisma')
            const { decrypt } = await import('./src/lib/encryption')

            const googleIntegration = await prisma.apiIntegration.findFirst({
                where: { provider: 'google_oauth', status: 'ACTIVE' },
            })

            if (googleIntegration) {
                const config = (googleIntegration.config as Record<string, string>) || {}
                const clientId = config.clientId
                const clientSecret = googleIntegration.apiKeyEncrypted
                    ? decrypt(googleIntegration.apiKeyEncrypted)
                    : null

                if (clientId && clientSecret) {
                    process.env.GOOGLE_CLIENT_ID = clientId
                    process.env.GOOGLE_CLIENT_SECRET = clientSecret
                    console.log('[instrumentation] Google OAuth credentials loaded from API Hub')
                }
            }
        } catch (e) {
            console.warn('[instrumentation] Could not load Google OAuth credentials:', e)
        }
    }
}
