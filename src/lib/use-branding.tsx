'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface BrandingSettings {
    appName: string
    tagline: string
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    supportEmail: string
    copyrightText: string
    footerLinks: { label: string; href: string }[]
}

const DEFAULT: BrandingSettings = {
    appName: 'ASocial',
    tagline: 'Social Media Management',
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#7c3aed',
    supportEmail: '',
    copyrightText: '',
    footerLinks: [],
}

const BrandingContext = createContext<BrandingSettings>(DEFAULT)

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<BrandingSettings>(DEFAULT)

    useEffect(() => {
        fetch('/api/admin/branding')
            .then(r => r.ok ? r.json() : DEFAULT)
            .then(d => setBranding({ ...DEFAULT, ...d }))
            .catch(() => { })
    }, [])

    return (
        <BrandingContext.Provider value= { branding } >
        { children }
        </BrandingContext.Provider>
    )
}

export function useBranding(): BrandingSettings {
    return useContext(BrandingContext)
}

/**
 * Server-side helper — fetches branding from DB directly (no HTTP).
 * Use in API routes, email templates, webhook handlers.
 */
export async function getBrandingServer(): Promise<BrandingSettings> {
    try {
        const { prisma } = await import('@/lib/prisma')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any
        const settings = await db.siteSettings.findUnique({ where: { id: 'default' } })
        return settings ? { ...DEFAULT, ...settings } : DEFAULT
    } catch {
        return DEFAULT
    }
}
