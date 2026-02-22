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

export const DEFAULT_BRANDING: BrandingSettings = {
    appName: 'NeeFlow',
    tagline: 'Social Media Management',
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#7c3aed',
    supportEmail: '',
    copyrightText: '',
    footerLinks: [],
}

const BrandingContext = createContext<BrandingSettings>(DEFAULT_BRANDING)

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING)

    useEffect(() => {
        fetch('/api/admin/branding')
            .then(r => r.ok ? r.json() : DEFAULT_BRANDING)
            .then(d => setBranding({ ...DEFAULT_BRANDING, ...d }))
            .catch(() => { })
    }, [])

    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBranding(): BrandingSettings {
    return useContext(BrandingContext)
}
