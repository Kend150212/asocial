import { prisma } from '@/lib/prisma'
import { type BrandingSettings, DEFAULT_BRANDING } from '@/lib/use-branding'

/**
 * Server-side helper — fetches branding from DB directly (no HTTP).
 * Use in API routes, email templates, webhook handlers, generateMetadata.
 */
export async function getBrandingServer(): Promise<BrandingSettings> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any
        const settings = await db.siteSettings.findUnique({ where: { id: 'default' } })
        if (!settings) return DEFAULT_BRANDING
        // Strip null/undefined so DEFAULT_BRANDING fallbacks are preserved
        const clean = Object.fromEntries(
            Object.entries(settings).filter(([, v]) => v !== null && v !== undefined && v !== '')
        )
        return { ...DEFAULT_BRANDING, ...clean }
    } catch {
        return DEFAULT_BRANDING
    }
}
